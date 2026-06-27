'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  MessageSquare,
  Send,
  Inbox,
  Mail,
  MailOpen,
  Paperclip,
  Reply,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronRight,
  User,
  Users,
  Clock,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatDate, formatDateTime, timeAgo, getStatusColor, getInitials } from '@/lib/utils';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

interface StaffRecipient {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
}

// ── Zod Schema ──────────────────────────────────────────────────────────────

const composeFormSchema = z.object({
  recipientId: z.string().min(1, 'Please select a recipient'),
  subject: z
    .string()
    .min(2, 'Subject must be at least 2 characters')
    .max(200, 'Subject must not exceed 200 characters'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(5000, 'Message must not exceed 5000 characters'),
});

type ComposeFormData = z.infer<typeof composeFormSchema>;

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const tabContentVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: 10, transition: { duration: 0.2, ease: 'easeIn' } },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
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

// ── Message List Item ──────────────────────────────────────────────────────

function MessageListItem({
  message,
  isSentView,
}: {
  message: Message;
  isSentView: boolean;
}) {
  const person = isSentView ? message.recipient : message.sender;
  const initials = getInitials(person.firstName, person.lastName);
  const href = `/dashboard/messages/${message.id}`;

  return (
    <motion.div variants={itemVariants} layout>
      <Link
        href={href}
        className={cn(
          'group flex items-start gap-4 rounded-xl border p-4 transition-all duration-200 hover:shadow-md',
          message.isRead && !isSentView
            ? 'border-gray-100 bg-white'
            : !isSentView
              ? 'border-ku-navy/10 bg-ku-navy/[0.02]'
              : 'border-gray-100 bg-white'
        )}
      >
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarFallback className="bg-ku-navy/10 text-sm font-semibold text-ku-navy">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {!message.isRead && !isSentView && (
                  <span className="h-2 w-2 shrink-0 rounded-full bg-ku-blue" />
                )}
                <h4
                  className={cn(
                    'truncate text-sm',
                    !message.isRead && !isSentView
                      ? 'font-semibold text-ku-navy'
                      : 'font-medium text-gray-700'
                  )}
                >
                  {person.firstName} {person.lastName}
                </h4>
                <Badge variant="outline" className="text-[10px] capitalize">
                  {person.role}
                </Badge>
              </div>
              <p
                className={cn(
                  'mt-0.5 truncate text-sm',
                  !message.isRead && !isSentView
                    ? 'font-medium text-ku-navy'
                    : 'text-gray-500'
                )}
              >
                {message.subject}
              </p>
              <p className="mt-0.5 truncate text-xs text-gray-400">
                {message.content}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs text-gray-400">{timeAgo(message.createdAt)}</span>
              <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-ku-gold" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Compose Form ───────────────────────────────────────────────────────────

function ComposeForm({
  initialRecipientId,
  onSent,
}: {
  initialRecipientId?: string;
  onSent?: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ComposeFormData>({
    resolver: zodResolver(composeFormSchema),
    defaultValues: {
      recipientId: initialRecipientId || '',
      subject: '',
      message: '',
    },
  });

  const selectedRecipient = watch('recipientId');

  const { data: recipients } = useQuery({
    queryKey: ['message-recipients'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<StaffRecipient[]>>(
        '/messages/recipients'
      );
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (formData: ComposeFormData) => {
      const { data } = await api.post<ApiResponse<Message>>(
        '/messages',
        formData
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'inbox'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'sent'] });
      toast.success('Message sent successfully');
      reset();
      onSent?.();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to send message';
      toast.error(message);
    },
  });

  const onSubmit = (formData: ComposeFormData) => {
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Recipient */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Recipient</label>
        <Select
          value={selectedRecipient}
          onValueChange={(value) => setValue('recipientId', value)}
        >
          <SelectTrigger className={cn(errors.recipientId && 'border-red-500')}>
            <SelectValue placeholder="Select recipient" />
          </SelectTrigger>
          <SelectContent>
            {recipients?.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>
                    {r.firstName} {r.lastName}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">
                    ({r.role}{r.department ? ` - ${r.department}` : ''})
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.recipientId && (
          <p className="text-xs text-red-500">{errors.recipientId.message}</p>
        )}
      </div>

      {/* Subject */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Subject</label>
        <Input
          placeholder="Enter message subject..."
          {...register('subject')}
          className={cn(errors.subject && 'border-red-500')}
        />
        {errors.subject && (
          <p className="text-xs text-red-500">{errors.subject.message}</p>
        )}
      </div>

      {/* Message */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Message</label>
        <textarea
          {...register('message')}
          rows={8}
          placeholder="Type your message here..."
          className={cn(
            'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical',
            errors.message && 'border-red-500'
          )}
        />
        {errors.message && (
          <p className="text-xs text-red-500">{errors.message.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => reset()}
          disabled={mutation.isPending}
        >
          Clear
        </Button>
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
              Send Message
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState('inbox');

  const {
    data: inboxMessages,
    isLoading: loadingInbox,
    isError: errorInbox,
    refetch: refetchInbox,
  } = useQuery({
    queryKey: ['messages', 'inbox'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Message[]>>('/messages', {
        params: { folder: 'inbox' },
      });
      return res.data;
    },
  });

  const {
    data: sentMessages,
    isLoading: loadingSent,
    isError: errorSent,
    refetch: refetchSent,
  } = useQuery({
    queryKey: ['messages', 'sent'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Message[]>>('/messages', {
        params: { folder: 'sent' },
      });
      return res.data;
    },
  });

  const unreadCount = inboxMessages?.filter((m) => !m.isRead).length || 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-3"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ku-navy/10">
          <MessageSquare className="h-5 w-5 text-ku-navy" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ku-navy">Messages</h1>
          <p className="text-sm text-gray-500">
            Communicate with university staff and administration
          </p>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="inbox" className="text-sm">
              <Inbox className="mr-2 h-4 w-4" />
              Inbox
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-ku-blue px-1.5 py-0.5 text-[10px] font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-sm">
              <Send className="mr-2 h-4 w-4" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="compose" className="text-sm">
              <Mail className="mr-2 h-4 w-4" />
              Compose
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              {/* Inbox Tab */}
              <TabsContent value="inbox" className="mt-0">
                <motion.div
                  key="inbox"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {loadingInbox ? (
                    <LoadingSkeleton />
                  ) : errorInbox ? (
                    <ErrorState
                      message="Failed to load inbox messages."
                      onRetry={() => refetchInbox()}
                    />
                  ) : inboxMessages && inboxMessages.length > 0 ? (
                    <div className="space-y-3">
                      {inboxMessages.map((message) => (
                        <MessageListItem
                          key={message.id}
                          message={message}
                          isSentView={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={MailOpen}
                      title="Inbox is empty"
                      description="You have no messages in your inbox. When you receive messages, they will appear here."
                    />
                  )}
                </motion.div>
              </TabsContent>

              {/* Sent Tab */}
              <TabsContent value="sent" className="mt-0">
                <motion.div
                  key="sent"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {loadingSent ? (
                    <LoadingSkeleton />
                  ) : errorSent ? (
                    <ErrorState
                      message="Failed to load sent messages."
                      onRetry={() => refetchSent()}
                    />
                  ) : sentMessages && sentMessages.length > 0 ? (
                    <div className="space-y-3">
                      {sentMessages.map((message) => (
                        <MessageListItem
                          key={message.id}
                          message={message}
                          isSentView={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Send}
                      title="No sent messages"
                      description="You have not sent any messages yet. Use the Compose tab to send a message."
                    />
                  )}
                </motion.div>
              </TabsContent>

              {/* Compose Tab */}
              <TabsContent value="compose" className="mt-0">
                <motion.div
                  key="compose"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-ku-navy">New Message</CardTitle>
                      <CardDescription>
                        Send a message to university staff or administration
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ComposeForm />
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
