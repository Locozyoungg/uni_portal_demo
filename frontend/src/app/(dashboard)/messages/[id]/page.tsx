'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MessageSquare,
  ArrowLeft,
  Reply,
  Send,
  User,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Trash2,
  Paperclip,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatDateTime, timeAgo, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  subject: string;
  content: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  recipient: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  isRead: boolean;
  createdAt: string;
}

// ── Zod Schema ──────────────────────────────────────────────────────────────

const replyFormSchema = z.object({
  message: z
    .string()
    .min(1, 'Reply message is required')
    .max(5000, 'Message must not exceed 5000 characters'),
});

type ReplyFormData = z.infer<typeof replyFormSchema>;

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-8 w-96" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">Something went wrong</h3>
      <p className="mb-6 max-w-md text-center text-sm text-gray-500">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function MessageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messageId = params.id as string;

  const [replyOpen, setReplyOpen] = useState(false);

  const {
    data: message,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['message', messageId],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Message>>(
        `/messages/${messageId}`
      );
      return res.data;
    },
    enabled: !!messageId,
  });

  // Mark as read when opened
  const markAsRead = useMutation({
    mutationFn: async () => {
      await api.patch(`/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  React.useEffect(() => {
    if (message && !message.isRead) {
      markAsRead.mutate();
    }
  }, [message?.id]);

  const isIncoming = message?.recipient.id === user?.id || message?.recipient.role === 'STUDENT';

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="p-6">
        <DetailSkeleton />
      </div>
    );
  }

  // ── Error ──
  if (isError || !message) {
    return (
      <div className="p-6">
        <ErrorState
          message={isError ? 'Failed to load message.' : 'Message not found.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const displayPerson = isIncoming ? message.sender : message.recipient;
  const initials = getInitials(displayPerson.firstName, displayPerson.lastName);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Back Button */}
      <motion.div variants={itemVariants}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/messages')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Messages
        </Button>
      </motion.div>

      {/* Message Header */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-ku-navy to-ku-blue text-white">
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-ku-gold/10" />
          <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/5" />
          <CardContent className="relative z-10 p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 border-2 border-ku-gold/50 shadow-lg">
                <AvatarFallback className="bg-ku-gold/20 text-lg font-bold text-ku-gold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-xl font-bold sm:text-2xl">{message.subject}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                        <User className="mr-1 h-3 w-3" />
                        {displayPerson.firstName} {displayPerson.lastName}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 capitalize">
                        {displayPerson.role}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/70">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDateTime(message.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    <span>
                      {isIncoming ? 'Received message' : 'Sent message'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setReplyOpen(true)}
                    className="bg-ku-gold/20 text-ku-gold hover:bg-ku-gold/30"
                  >
                    <Reply className="mr-2 h-4 w-4" />
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Message Content */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-ku-navy">Message</CardTitle>
            <CardDescription>
              {isIncoming
                ? `From: ${displayPerson.firstName} ${displayPerson.lastName}`
                : `To: ${displayPerson.firstName} ${displayPerson.lastName}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-gray-50 p-5">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3 mb-4">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-ku-navy/10 text-xs font-semibold text-ku-navy">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-ku-navy">
                    {displayPerson.firstName} {displayPerson.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {message.content}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reply Dialog */}
      <ReplyDialog
        open={replyOpen}
        onOpenChange={setReplyOpen}
        messageId={messageId}
        recipientName={`${displayPerson.firstName} ${displayPerson.lastName}`}
      />
    </motion.div>
  );
}

// ── Reply Dialog ───────────────────────────────────────────────────────────

function ReplyDialog({
  open,
  onOpenChange,
  messageId,
  recipientName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  recipientName: string;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReplyFormData>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: {
      message: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (formData: ReplyFormData) => {
      const { data } = await api.post<ApiResponse<{ id: string }>>(
        `/messages/${messageId}/reply`,
        formData
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Reply sent successfully');
      reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to send reply';
      toast.error(message);
    },
  });

  const onSubmit = (formData: ReplyFormData) => {
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Reply className="h-5 w-5 text-ku-gold" />
            Reply to {recipientName}
          </DialogTitle>
          <DialogDescription>
            Your reply will be sent as a new message.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              {...register('message')}
              rows={6}
              placeholder="Type your reply..."
              className={cn(
                'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
                errors.message && 'border-red-500'
              )}
            />
            {errors.message && (
              <p className="text-xs text-red-500">{errors.message.message}</p>
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
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
