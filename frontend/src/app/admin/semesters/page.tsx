'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Search,
  Loader2,
  GraduationCap,
  Star,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface Semester {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  registrationOpen: boolean;
  createdAt: string;
}

interface SemesterResponse {
  success: boolean;
  data: Semester[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Validation Schema ──────────────────────────────────────────────────────

const semesterFormSchema = z.object({
  name: z.string().min(2, 'Semester name must be at least 2 characters'),
  year: z.coerce.number().int().min(2000, 'Year must be 2000 or later').max(2100, 'Year must be 2100 or earlier'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isCurrent: z.boolean().default(false),
  registrationOpen: z.boolean().default(false),
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return new Date(data.endDate) > new Date(data.startDate);
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

type SemesterFormData = z.infer<typeof semesterFormSchema>;

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getRegistrationBadgeColor(registrationOpen: boolean): string {
  return registrationOpen
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}

function getCurrentBadgeColor(isCurrent: boolean): string {
  return isCurrent
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : 'bg-slate-500/10 text-slate-400 border-slate-500/20';
}

// ── Semester Dialog ────────────────────────────────────────────────────────

function SemesterDialog({
  open,
  onOpenChange,
  semester,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semester?: Semester | null;
  onSubmit: (data: SemesterFormData) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SemesterFormData>({
    resolver: zodResolver(semesterFormSchema),
    defaultValues: semester
      ? {
          name: semester.name,
          year: semester.year,
          startDate: semester.startDate ? semester.startDate.slice(0, 10) : '',
          endDate: semester.endDate ? semester.endDate.slice(0, 10) : '',
          isCurrent: semester.isCurrent,
          registrationOpen: semester.registrationOpen,
        }
      : {
          name: '',
          year: new Date().getFullYear(),
          startDate: '',
          endDate: '',
          isCurrent: false,
          registrationOpen: false,
        },
  });

  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
            {semester ? 'Edit Semester' : 'Add New Semester'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {semester
              ? `Editing ${semester.name} (${semester.year})`
              : 'Fill in the details to add a new semester'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Semester Name *</label>
            <Input
              {...register('name')}
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              placeholder="e.g. Semester 1, Fall Semester"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Year */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Year *</label>
              <Input
                {...register('year')}
                type="number"
                min={2000}
                max={2100}
                className="border-slate-700 bg-slate-800 text-white"
              />
              {errors.year && (
                <p className="text-xs text-red-400">{errors.year.message}</p>
              )}
            </div>

            {/* Spacer */}
            <div />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Start Date *</label>
              <Input
                {...register('startDate')}
                type="date"
                className="border-slate-700 bg-slate-800 text-white"
              />
              {errors.startDate && (
                <p className="text-xs text-red-400">{errors.startDate.message}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">End Date *</label>
              <Input
                {...register('endDate')}
                type="date"
                className="border-slate-700 bg-slate-800 text-white"
              />
              {errors.endDate && (
                <p className="text-xs text-red-400">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Date validation hint */}
          {watchStartDate && watchEndDate && new Date(watchEndDate) <= new Date(watchStartDate) && (
            <p className="text-xs text-red-400">
              End date must be after start date
            </p>
          )}

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                {...register('isCurrent')}
                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <div>
                <p className="text-sm font-medium text-white">Current Semester</p>
                <p className="text-xs text-slate-400">Mark as the active semester</p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 cursor-pointer hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                {...register('registrationOpen')}
                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0"
              />
              <div>
                <p className="text-sm font-medium text-white">Registration Open</p>
                <p className="text-xs text-slate-400">Allow course registration</p>
              </div>
            </label>
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : semester ? (
                'Update Semester'
              ) : (
                'Add Semester'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation Dialog ─────────────────────────────────────────────

function DeleteDialog({
  open,
  onOpenChange,
  semesterName,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Delete Semester
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">{semesterName}</span>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Semester'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Set Current Confirmation Dialog ────────────────────────────────────────

function SetCurrentDialog({
  open,
  onOpenChange,
  semesterName,
  onConfirm,
  isSetting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterName: string;
  onConfirm: () => void;
  isSetting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-amber-400">
            <Star className="h-5 w-5" />
            Set as Current Semester
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Are you sure you want to set{' '}
            <span className="font-semibold text-white">{semesterName}</span> as
            the current semester? Any previously current semester will be
            unmarked.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSetting}
            className="bg-amber-600 hover:bg-amber-500 text-white"
          >
            {isSetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting...
              </>
            ) : (
              'Set as Current'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────

export default function AdminSemestersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setCurrentDialogOpen, setSetCurrentDialogOpen] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<Semester | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery<SemesterResponse>({
    queryKey: ['admin-semesters', page, limit, search],
    queryFn: () =>
      api
        .get('/admin/semesters', {
          params: { page, limit, search: search || undefined },
        })
        .then((res) => res.data),
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (formData: SemesterFormData) =>
      api.post('/admin/semesters', {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Semester created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-semesters'] });
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create semester');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: formData }: { id: string; data: SemesterFormData }) =>
      api.put(`/admin/semesters/${id}`, {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      }),
    onSuccess: () => {
      toast.success('Semester updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-semesters'] });
      setDialogOpen(false);
      setSelectedSemester(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update semester');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/semesters/${id}`),
    onSuccess: () => {
      toast.success('Semester deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-semesters'] });
      setDeleteDialogOpen(false);
      setSelectedSemester(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete semester');
    },
  });

  const setCurrentMutation = useMutation({
    mutationFn: (id: string) => api.put(`/admin/semesters/${id}/set-current`),
    onSuccess: () => {
      toast.success('Semester set as current');
      queryClient.invalidateQueries({ queryKey: ['admin-semesters'] });
      setSetCurrentDialogOpen(false);
      setSelectedSemester(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to set semester as current');
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setSelectedSemester(null);
    setDialogOpen(true);
  };

  const handleEdit = (semester: Semester) => {
    setSelectedSemester(semester);
    setDialogOpen(true);
  };

  const handleDeleteClick = (semester: Semester) => {
    setSelectedSemester(semester);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedSemester) {
      deleteMutation.mutate(selectedSemester.id);
    }
  };

  const handleSetCurrentClick = (semester: Semester) => {
    setSelectedSemester(semester);
    setSetCurrentDialogOpen(true);
  };

  const handleSetCurrentConfirm = () => {
    if (selectedSemester) {
      setCurrentMutation.mutate(selectedSemester.id);
    }
  };

  const handleFormSubmit = (formData: SemesterFormData) => {
    if (selectedSemester) {
      updateMutation.mutate({ id: selectedSemester.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setPage(1);
    },
    []
  );

  const semesters = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalSemesters = data?.total || 0;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const isSetting = setCurrentMutation.isPending;

  // ── Loading State ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-56 bg-slate-800" />
        <Skeleton className="h-4 w-36 bg-slate-800" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-72 bg-slate-800" />
          <Skeleton className="h-10 w-40 bg-slate-800" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full bg-slate-800" />
        ))}
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-red-500/10 p-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">Failed to load semesters</h3>
        <p className="mt-1 text-sm text-slate-400">Something went wrong. Please try again.</p>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="mt-4 border-slate-700 text-slate-300 hover:bg-slate-800"
        >
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
            <h1 className="text-2xl font-bold text-white">Manage Semesters</h1>
            <p className="text-sm text-slate-400 mt-1">{totalSemesters} total semesters</p>
          </div>
          <Button
            onClick={handleAddNew}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Semester
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by semester name or year..."
                value={search}
                onChange={handleSearch}
                className="pl-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Semesters Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-0">
            {semesters.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-medium">Semester</TableHead>
                      <TableHead className="text-slate-400 font-medium">Year</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden md:table-cell">Start Date</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden md:table-cell">End Date</TableHead>
                      <TableHead className="text-slate-400 font-medium">Status</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden sm:table-cell">Registration</TableHead>
                      <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semesters.map((semester, idx) => (
                      <motion.tr
                        key={semester.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={cn(
                          'border-slate-800 hover:bg-slate-800/50',
                          semester.isCurrent && 'bg-emerald-500/5'
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                              <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{semester.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-300">{semester.year}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className="border-slate-700 text-slate-300 text-xs font-mono"
                          >
                            <Calendar className="mr-1 h-3 w-3 text-slate-500" />
                            {semester.startDate ? formatDate(semester.startDate) : '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className="border-slate-700 text-slate-300 text-xs font-mono"
                          >
                            <Calendar className="mr-1 h-3 w-3 text-slate-500" />
                            {semester.endDate ? formatDate(semester.endDate) : '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', getCurrentBadgeColor(semester.isCurrent))}
                          >
                            {semester.isCurrent ? (
                              <>
                                <Star className="mr-1 h-3 w-3" />
                                Current
                              </>
                            ) : (
                              'Inactive'
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant="secondary"
                            className={cn('text-xs', getRegistrationBadgeColor(semester.registrationOpen))}
                          >
                            {semester.registrationOpen ? (
                              <>
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Open
                              </>
                            ) : (
                              <>
                                <Clock className="mr-1 h-3 w-3" />
                                Closed
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {/* Set as Current — only show when not already current */}
                            {!semester.isCurrent && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                                onClick={() => handleSetCurrentClick(semester)}
                                title="Set as current semester"
                              >
                                <Star className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                              onClick={() => handleEdit(semester)}
                              title="Edit semester"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteClick(semester)}
                              title="Delete semester"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between p-4 border-t border-slate-800">
                  <p className="text-sm text-slate-500">
                    Page {page} of {totalPages} ({totalSemesters} total)
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
                <Calendar className="h-12 w-12 text-slate-700 mb-3" />
                <h3 className="text-lg font-medium text-slate-300">No semesters found</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {search
                    ? 'Try adjusting your search'
                    : 'Get started by adding your first semester'}
                </p>
                {!search && (
                  <Button
                    onClick={handleAddNew}
                    className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Semester
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <SemesterDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedSemester(null);
        }}
        semester={selectedSemester}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        semesterName={
          selectedSemester
            ? `${selectedSemester.name} (${selectedSemester.year})`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />

      <SetCurrentDialog
        open={setCurrentDialogOpen}
        onOpenChange={setSetCurrentDialogOpen}
        semesterName={
          selectedSemester
            ? `${selectedSemester.name} (${selectedSemester.year})`
            : ''
        }
        onConfirm={handleSetCurrentConfirm}
        isSetting={isSetting}
      />
    </motion.div>
  );
}
