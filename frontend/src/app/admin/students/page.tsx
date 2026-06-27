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
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Filter,
  Download,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Eye,
  X,
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
import { cn, formatDate, getStatusColor } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  programme?: { name: string };
  yearOfStudy: number;
  feeStatus: string;
  enrollmentStatus: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  createdAt: string;
}

interface StudentResponse {
  success: boolean;
  data: Student[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Validation Schema ──────────────────────────────────────────────────────

const studentFormSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  admissionNumber: z.string().min(3, 'Admission number is required'),
  programme: z.string().min(1, 'Programme is required'),
  yearOfStudy: z.coerce.number().int().min(1).max(6),
  gender: z.string().optional(),
  enrollmentStatus: z.string().min(1, 'Enrollment status is required'),
  feeStatus: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

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

// ── Student Dialog ─────────────────────────────────────────────────────────

function StudentDialog({
  open,
  onOpenChange,
  student,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSubmit: (data: StudentFormData) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: student
      ? {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          phone: student.phone || '',
          admissionNumber: student.admissionNumber,
          programme: student.programme?.name || '',
          yearOfStudy: student.yearOfStudy,
          gender: student.gender || '',
          enrollmentStatus: student.enrollmentStatus,
          feeStatus: student.feeStatus || '',
        }
      : {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          admissionNumber: '',
          programme: '',
          yearOfStudy: 1,
          gender: '',
          enrollmentStatus: 'ACTIVE',
          feeStatus: 'CLEAR',
        },
  });

  const handleFormSubmit = (data: StudentFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
            {student ? 'Edit Student' : 'Add New Student'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {student
              ? `Editing ${student.firstName} ${student.lastName}`
              : 'Fill in the details to add a new student'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">First Name *</label>
              <Input
                {...register('firstName')}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                placeholder="John"
              />
              {errors.firstName && (
                <p className="text-xs text-red-400">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Last Name *</label>
              <Input
                {...register('lastName')}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="text-xs text-red-400">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Email *</label>
              <Input
                {...register('email')}
                type="email"
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Phone</label>
              <Input
                {...register('phone')}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                placeholder="+254 712 345 678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Admission Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Admission Number *</label>
              <Input
                {...register('admissionNumber')}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                placeholder="KU/2024/001"
              />
              {errors.admissionNumber && (
                <p className="text-xs text-red-400">{errors.admissionNumber.message}</p>
              )}
            </div>

            {/* Programme */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Programme *</label>
              <Input
                {...register('programme')}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                placeholder="BSc. Computer Science"
              />
              {errors.programme && (
                <p className="text-xs text-red-400">{errors.programme.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Year of Study */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Year of Study *</label>
              <Input
                {...register('yearOfStudy')}
                type="number"
                min={1}
                max={6}
                className="border-slate-700 bg-slate-800 text-white"
              />
              {errors.yearOfStudy && (
                <p className="text-xs text-red-400">{errors.yearOfStudy.message}</p>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Gender</label>
              <select
                {...register('gender')}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select...</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Enrollment Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Status *</label>
              <select
                {...register('enrollmentStatus')}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="GRADUATED">Graduated</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
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
              ) : student ? (
                'Update Student'
              ) : (
                'Add Student'
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
  studentName,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Are you sure you want to delete <span className="font-semibold text-white">{studentName}</span>?
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
              'Delete Student'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Student Detail Dialog ──────────────────────────────────────────────────

function StudentDetailDialog({
  open,
  onOpenChange,
  student,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
}) {
  if (!student) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-emerald-400" />
            Student Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-lg font-bold">
              {student.firstName[0]}{student.lastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {student.firstName} {student.lastName}
              </h3>
              <p className="text-sm text-slate-400">{student.admissionNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Mail className="h-3 w-3" />
                Email
              </div>
              <p className="text-sm text-slate-200">{student.email}</p>
            </div>
            {student.phone && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Phone className="h-3 w-3" />
                  Phone
                </div>
                <p className="text-sm text-slate-200">{student.phone}</p>
              </div>
            )}
            <div className="space-y-1">
              <div className="text-slate-500 text-xs">Programme</div>
              <p className="text-sm text-slate-200">{student.programme?.name || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-xs">Year of Study</div>
              <p className="text-sm text-slate-200">Year {student.yearOfStudy}</p>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-xs">Fee Status</div>
              <Badge className={getStatusColor(student.feeStatus)} variant="secondary">
                {student.feeStatus}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="text-slate-500 text-xs">Enrollment</div>
              <Badge className={getStatusColor(student.enrollmentStatus)} variant="secondary">
                {student.enrollmentStatus}
              </Badge>
            </div>
            {student.address && (
              <div className="space-y-1 col-span-2">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <MapPin className="h-3 w-3" />
                  Address
                </div>
                <p className="text-sm text-slate-200">{student.address}</p>
              </div>
            )}
            <div className="space-y-1">
              <div className="text-slate-500 text-xs">Joined</div>
              <p className="text-sm text-slate-200">{formatDate(student.createdAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────

export default function AdminStudentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery<StudentResponse>({
    queryKey: ['admin-students', page, limit, search, statusFilter],
    queryFn: () =>
      api
        .get('/admin/students', {
          params: { page, limit, search: search || undefined, status: statusFilter !== 'all' ? statusFilter : undefined },
        })
        .then((res) => res.data),
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (formData: StudentFormData) => api.post('/admin/students', formData),
    onSuccess: () => {
      toast.success('Student created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create student');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: formData }: { id: string; data: StudentFormData }) =>
      api.put(`/admin/students/${id}`, formData),
    onSuccess: () => {
      toast.success('Student updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update student');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/students/${id}`),
    onSuccess: () => {
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete student');
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setSelectedStudent(null);
    setDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const handleView = (student: Student) => {
    setViewingStudent(student);
    setDetailDialogOpen(true);
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedStudent) {
      deleteMutation.mutate(selectedStudent.id);
    }
  };

  const handleFormSubmit = (formData: StudentFormData) => {
    if (selectedStudent) {
      updateMutation.mutate({ id: selectedStudent.id, data: formData });
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

  const students = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalStudents = data?.total || 0;

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  // ── Loading State ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-32 bg-slate-800" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-72 bg-slate-800" />
          <Skeleton className="h-10 w-32 bg-slate-800" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
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
        <h3 className="mt-4 text-lg font-semibold text-white">Failed to load students</h3>
        <p className="mt-1 text-sm text-slate-400">Something went wrong. Please try again.</p>
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
            <h1 className="text-2xl font-bold text-white">Students Management</h1>
            <p className="text-sm text-slate-400 mt-1">
              {totalStudents} total students
            </p>
          </div>
          <Button
            onClick={handleAddNew}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by name, admission number, or email..."
                  value={search}
                  onChange={handleSearch}
                  className="pl-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="flex gap-2">
                <div className="w-40">
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="GRADUATED">Graduated</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => { setSearch(''); setStatusFilter('all'); setPage(1); }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Students Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-0">
            {students.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-medium">Admission #</TableHead>
                      <TableHead className="text-slate-400 font-medium">Name</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden md:table-cell">Programme</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden sm:table-cell">Year</TableHead>
                      <TableHead className="text-slate-400 font-medium">Fee Status</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden sm:table-cell">Enrollment</TableHead>
                      <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, idx) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-slate-800 hover:bg-slate-800/50 cursor-pointer"
                        onClick={() => handleView(student)}
                      >
                        <TableCell className="font-mono text-xs text-slate-300">
                          {student.admissionNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {student.firstName} {student.lastName}
                              </p>
                              <p className="text-xs text-slate-500">{student.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-300">
                          {student.programme?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                            Yr {student.yearOfStudy}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn('text-xs', getStatusColor(student.feeStatus))} variant="secondary">
                            {student.feeStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge className={cn('text-xs', getStatusColor(student.enrollmentStatus))} variant="secondary">
                            {student.enrollmentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                              onClick={(e) => { e.stopPropagation(); handleEdit(student); }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                              onClick={(e) => { e.stopPropagation(); handleDeleteClick(student); }}
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
                    Page {page} of {totalPages} ({totalStudents} total)
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
                <Users className="h-12 w-12 text-slate-700 mb-3" />
                <h3 className="text-lg font-medium text-slate-300">No students found</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {search ? 'Try adjusting your search or filters' : 'Get started by adding your first student'}
                </p>
                {!search && (
                  <Button onClick={handleAddNew} className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <StudentDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedStudent(null);
        }}
        student={selectedStudent}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <StudentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        student={viewingStudent}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        studentName={
          selectedStudent
            ? `${selectedStudent.firstName} ${selectedStudent.lastName}`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </motion.div>
  );
}
