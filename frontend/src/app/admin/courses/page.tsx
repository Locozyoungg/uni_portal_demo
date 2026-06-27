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
  BookOpen,
  Search,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
  Loader2,
  GraduationCap,
  Clock,
  Hash,
  Layers,
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
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  department?: string;
  semester?: string;
  year?: number;
  studentsCount?: number;
  createdAt: string;
}

interface CourseResponse {
  success: boolean;
  data: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Validation Schema ──────────────────────────────────────────────────────

const courseFormSchema = z.object({
  code: z.string().min(2, 'Course code is required').max(20),
  name: z.string().min(3, 'Course name must be at least 3 characters'),
  credits: z.coerce.number().int().min(1, 'Minimum 1 credit').max(20, 'Maximum 20 credits'),
  department: z.string().optional(),
  semester: z.string().optional(),
  year: z.coerce.number().int().min(1).max(6).optional(),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

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

// ── Course Dialog ─────────────────────────────────────────────────────────

function CourseDialog({
  open,
  onOpenChange,
  course,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSubmit: (data: CourseFormData) => void;
  isSubmitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: course
      ? {
          code: course.code,
          name: course.name,
          credits: course.credits,
          department: course.department || '',
          semester: course.semester || '',
          year: course.year || undefined,
        }
      : {
          code: '',
          name: '',
          credits: 3,
          department: '',
          semester: '',
          year: undefined,
        },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-400" />
            {course ? 'Edit Course' : 'Add New Course'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {course ? `Editing ${course.name} (${course.code})` : 'Fill in the details to add a new course'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Course Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Course Code *</label>
              <Input
                {...register('code')}
                className="border-slate-700 bg-slate-800 text-white uppercase placeholder:text-slate-500"
                placeholder="CSC 101"
              />
              {errors.code && (
                <p className="text-xs text-red-400">{errors.code.message}</p>
              )}
            </div>

            {/* Credits */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Credits *</label>
              <Input
                {...register('credits')}
                type="number"
                min={1}
                max={20}
                className="border-slate-700 bg-slate-800 text-white"
              />
              {errors.credits && (
                <p className="text-xs text-red-400">{errors.credits.message}</p>
              )}
            </div>
          </div>

          {/* Course Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Course Name *</label>
            <Input
              {...register('name')}
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              placeholder="Introduction to Computer Science"
            />
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Department</label>
              <Input
                {...register('department')}
                className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                placeholder="Computer Science"
              />
            </div>

            {/* Semester */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Semester</label>
              <select
                {...register('semester')}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select...</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Semester 3">Semester 3</option>
              </select>
            </div>
          </div>

          {/* Year */}
          <div className="space-y-1.5 w-1/2">
            <label className="text-xs font-medium text-slate-300">Target Year</label>
            <select
              {...register('year')}
              className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Years</option>
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>Year {y}</option>
              ))}
            </select>
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
              ) : course ? (
                'Update Course'
              ) : (
                'Add Course'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation ──────────────────────────────────────────────────

function DeleteDialog({
  open,
  onOpenChange,
  courseName,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseName: string;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Delete Course
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Are you sure you want to delete <span className="font-semibold text-white">{courseName}</span>?
            This will also remove all associated registrations.
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
              'Delete Course'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery<CourseResponse>({
    queryKey: ['admin-courses', page, limit, search],
    queryFn: () =>
      api
        .get('/admin/courses', {
          params: { page, limit, search: search || undefined },
        })
        .then((res) => res.data),
  });

  // ── Mutations ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (formData: CourseFormData) => api.post('/admin/courses', formData),
    onSuccess: () => {
      toast.success('Course created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create course');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: formData }: { id: string; data: CourseFormData }) =>
      api.put(`/admin/courses/${id}`, formData),
    onSuccess: () => {
      toast.success('Course updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setDialogOpen(false);
      setSelectedCourse(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update course');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/courses/${id}`),
    onSuccess: () => {
      toast.success('Course deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to delete course');
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleAddNew = () => {
    setSelectedCourse(null);
    setDialogOpen(true);
  };

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  const handleDeleteClick = (course: Course) => {
    setSelectedCourse(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedCourse) {
      deleteMutation.mutate(selectedCourse.id);
    }
  };

  const handleFormSubmit = (formData: CourseFormData) => {
    if (selectedCourse) {
      updateMutation.mutate({ id: selectedCourse.id, data: formData });
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

  const courses = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalCourses = data?.total || 0;
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
        <h3 className="mt-4 text-lg font-semibold text-white">Failed to load courses</h3>
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
            <h1 className="text-2xl font-bold text-white">Courses Management</h1>
            <p className="text-sm text-slate-400 mt-1">{totalCourses} total courses</p>
          </div>
          <Button onClick={handleAddNew} className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Course
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
                placeholder="Search by course code or name..."
                value={search}
                onChange={handleSearch}
                className="pl-9 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Courses Table */}
      <motion.div variants={itemVariants}>
        <Card className="border-slate-800 bg-slate-900">
          <CardContent className="p-0">
            {courses.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400 font-medium">Code</TableHead>
                      <TableHead className="text-slate-400 font-medium">Course Name</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden md:table-cell">Department</TableHead>
                      <TableHead className="text-slate-400 font-medium">Credits</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden sm:table-cell">Semester</TableHead>
                      <TableHead className="text-slate-400 font-medium hidden sm:table-cell">Students</TableHead>
                      <TableHead className="text-slate-400 font-medium text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course, idx) => (
                      <motion.tr
                        key={course.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="border-slate-800 hover:bg-slate-800/50"
                      >
                        <TableCell>
                          <Badge variant="outline" className="font-mono border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
                            {course.code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-white">{course.name}</p>
                            <p className="text-xs text-slate-500">Created {new Date(course.createdAt).toLocaleDateString()}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-slate-300">
                          {course.department || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Hash className="h-3 w-3 text-slate-500" />
                            <span className="text-sm font-medium text-white">{course.credits}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {course.semester ? (
                            <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                              {course.semester}
                            </Badge>
                          ) : (
                            <span className="text-sm text-slate-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm text-slate-300">{course.studentsCount ?? 0}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                              onClick={() => handleEdit(course)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                              onClick={() => handleDeleteClick(course)}
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
                    Page {page} of {totalPages} ({totalCourses} total)
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
                <BookOpen className="h-12 w-12 text-slate-700 mb-3" />
                <h3 className="text-lg font-medium text-slate-300">No courses found</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {search ? 'Try adjusting your search' : 'Get started by adding your first course'}
                </p>
                {!search && (
                  <Button onClick={handleAddNew} className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Course
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <CourseDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedCourse(null);
        }}
        course={selectedCourse}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        courseName={selectedCourse ? `${selectedCourse.name} (${selectedCourse.code})` : ''}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </motion.div>
  );
}
