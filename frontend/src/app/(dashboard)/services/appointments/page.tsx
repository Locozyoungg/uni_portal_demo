'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  CalendarDays,
  Clock,
  User,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Stethoscope,
  Briefcase,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { cn, formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
}

interface Appointment {
  id: string;
  staffMember: {
    firstName: string;
    lastName: string;
    role: string;
  };
  date: string;
  time: string;
  purpose: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

// ── Zod Schema ──────────────────────────────────────────────────────────────

const appointmentFormSchema = z.object({
  staffMemberId: z.string().min(1, 'Please select a staff member'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  purpose: z
    .string()
    .min(5, 'Please provide at least 5 characters for the purpose')
    .max(500, 'Purpose must not exceed 500 characters'),
});

type AppointmentFormData = z.infer<typeof appointmentFormSchema>;

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { icon: React.ElementType; className: string }> = {
  SCHEDULED: { icon: Clock, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  COMPLETED: { icon: CheckCircle2, className: 'bg-green-50 text-green-700 border-green-200' },
  CANCELLED: { icon: XCircle, className: 'bg-red-50 text-red-700 border-red-200' },
};

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
];

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return <Badge variant="secondary">{status}</Badge>;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn('gap-1.5 font-medium', config.className)}>
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </Badge>
  );
}

function AppointmentCard({
  appointment,
  variant = 'upcoming',
}: {
  appointment: Appointment;
  variant?: 'upcoming' | 'past';
}) {
  const isUpcoming = variant === 'upcoming';
  const isPast = variant === 'past';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'transition-all duration-300 hover:shadow-md',
          isPast && 'opacity-75'
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className={cn(
                'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                isUpcoming ? 'bg-ku-navy/10 text-ku-navy' : 'bg-gray-100 text-gray-500'
              )}>
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-ku-navy">
                  {appointment.staffMember.firstName} {appointment.staffMember.lastName}
                </h3>
                <p className="text-xs text-gray-500 capitalize">{appointment.staffMember.role}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>{formatDate(appointment.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{appointment.time}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {appointment.purpose}
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <StatusBadge status={appointment.status} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Failed to load appointments</h3>
      <p className="mt-1 text-sm text-gray-500">Please try again later.</p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="max-w-sm text-sm text-gray-500">{description}</p>
    </div>
  );
}

// ── Book Appointment Dialog ───────────────────────────────────────────────

function BookAppointmentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      staffMemberId: '',
      date: '',
      time: '',
      purpose: '',
    },
  });

  const selectedStaff = watch('staffMemberId');
  const selectedDate = watch('date');

  const { data: staffMembers } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<StaffMember[]>>('/staff');
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (formData: AppointmentFormData) => {
      const { data } = await api.post<ApiResponse<Appointment>>(
        '/students/appointments',
        formData
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment booked successfully');
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to book appointment';
      toast.error(message);
    },
  });

  const onSubmit = (formData: AppointmentFormData) => {
    mutation.mutate(formData);
  };

  // Get today's date in YYYY-MM-DD for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-ku-gold" />
            Book Appointment
          </DialogTitle>
          <DialogDescription>
            Schedule an appointment with a staff member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Staff Member */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Staff Member</label>
            <Select
              value={selectedStaff}
              onValueChange={(value) => setValue('staffMemberId', value)}
            >
              <SelectTrigger className={cn(errors.staffMemberId && 'border-red-500')}>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffMembers?.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        {staff.firstName} {staff.lastName}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">
                        ({staff.role})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.staffMemberId && (
              <p className="text-xs text-red-500">{errors.staffMemberId.message}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Date</label>
              <Input
                type="date"
                min={today}
                {...register('date')}
                className={cn(errors.date && 'border-red-500')}
              />
              {errors.date && (
                <p className="text-xs text-red-500">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time</label>
              <Select
                value={selectedDate ? watch('time') : undefined}
                onValueChange={(value) => setValue('time', value)}
              >
                <SelectTrigger className={cn(errors.time && 'border-red-500')}>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.time && (
                <p className="text-xs text-red-500">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Purpose</label>
            <textarea
              {...register('purpose')}
              rows={3}
              placeholder="Briefly describe the purpose of your appointment..."
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                errors.purpose && 'border-red-500'
              )}
            />
            {errors.purpose && (
              <p className="text-xs text-red-500">{errors.purpose.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={mutation.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-ku-navy text-white hover:bg-ku-blue"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    data: appointments,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['appointments'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Appointment[]>>(
        '/students/appointments'
      );
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }

  const upcoming = appointments?.filter((a) => a.status === 'SCHEDULED') || [];
  const past = appointments?.filter((a) => a.status !== 'SCHEDULED') || [];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ku-navy/10">
            <CalendarDays className="h-5 w-5 text-ku-navy" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ku-navy">Appointments</h1>
            <p className="text-sm text-gray-500">
              Schedule and manage your appointments with staff
            </p>
          </div>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-ku-navy text-white hover:bg-ku-blue shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          Book Appointment
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="upcoming">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="upcoming" className="text-sm">
              <Clock className="mr-2 h-4 w-4" />
              Upcoming
              {upcoming.length > 0 && (
                <span className="ml-1.5 rounded-full bg-ku-navy/10 px-1.5 py-0.5 text-xs font-medium">
                  {upcoming.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="past" className="text-sm">
              <Calendar className="mr-2 h-4 w-4" />
              Past
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <TabsContent value="upcoming" className="mt-0">
                <motion.div
                  key="upcoming"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {upcoming.length > 0 ? (
                    <div className="space-y-4">
                      {upcoming.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          variant="upcoming"
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={CalendarDays}
                      title="No upcoming appointments"
                      description="You have no scheduled appointments. Book one using the button above."
                    />
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="past" className="mt-0">
                <motion.div
                  key="past"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {past.length > 0 ? (
                    <div className="space-y-4">
                      {past.map((appointment) => (
                        <AppointmentCard
                          key={appointment.id}
                          appointment={appointment}
                          variant="past"
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Calendar}
                      title="No past appointments"
                      description="Your completed and cancelled appointments will appear here."
                    />
                  )}
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>

      {/* Book Appointment Dialog */}
      <BookAppointmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </motion.div>
  );
}
