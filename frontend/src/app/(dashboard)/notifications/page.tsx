'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  BellRing,
  Megaphone,
  Info,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileText,
  CreditCard,
  BookOpen,
  CheckCheck,
  Loader2,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { cn, timeAgo, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: 'ANNOUNCEMENT' | 'REMINDER' | 'ALERT' | 'UPDATE' | 'MESSAGE' | 'PAYMENT' | 'ACADEMIC';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const notificationVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ── Constants ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ANNOUNCEMENT: { icon: Megaphone, color: 'text-ku-gold', bg: 'bg-ku-gold/10' },
  REMINDER: { icon: Bell, color: 'text-blue-600', bg: 'bg-blue-50' },
  ALERT: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  UPDATE: { icon: Info, color: 'text-purple-600', bg: 'bg-purple-50' },
  MESSAGE: { icon: MessageSquare, color: 'text-teal-600', bg: 'bg-teal-50' },
  PAYMENT: { icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
  ACADEMIC: { icon: BookOpen, color: 'text-orange-600', bg: 'bg-orange-50' },
};

// ── Sub-components ─────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  const config = TYPE_CONFIG[type];
  if (!config) {
    const Icon = Bell;
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
        <Icon className="h-5 w-5 text-gray-500" />
      </div>
    );
  }
  const Icon = config.icon;
  return (
    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', config.bg)}>
      <Icon className={cn('h-5 w-5', config.color)} />
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    ANNOUNCEMENT: 'Announcement',
    REMINDER: 'Reminder',
    ALERT: 'Alert',
    UPDATE: 'Update',
    MESSAGE: 'Message',
    PAYMENT: 'Payment',
    ACADEMIC: 'Academic',
  };
  return (
    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
      {labels[type] || type}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-10 w-72" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
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
      <h3 className="mt-4 text-lg font-semibold">Failed to load notifications</h3>
      <p className="mt-1 text-sm text-gray-500">
        Something went wrong while fetching your notifications.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
        <BellOff className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">No notifications</h3>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        You are all caught up! New notifications will appear here when they arrive.
      </p>
    </motion.div>
  );
}

// ── Notification Item ──────────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkAsRead,
  isMarking,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  isMarking: boolean;
}) {
  return (
    <motion.div
      variants={notificationVariants}
      layout
      className={cn(
        'group relative flex items-start gap-4 rounded-xl border p-4 transition-all duration-200',
        notification.isRead
          ? 'border-gray-100 bg-white'
          : 'border-ku-navy/10 bg-ku-navy/[0.02] hover:border-ku-navy/20'
      )}
    >
      {/* Read/unread indicator dot */}
      {!notification.isRead && (
        <div className="absolute left-4 top-4 h-2 w-2 rounded-full bg-ku-blue mt-4" />
      )}

      {/* Icon */}
      <div className={cn(notification.isRead ? 'ml-0' : 'ml-4')}>
        <NotificationIcon type={notification.type} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <TypeBadge type={notification.type} />
              {!notification.isRead && (
                <span className="rounded-full bg-ku-blue px-1.5 py-0.5 text-[10px] font-medium text-white">
                  New
                </span>
              )}
            </div>
            <h4
              className={cn(
                'mt-0.5 text-sm leading-snug',
                notification.isRead ? 'font-normal text-gray-600' : 'font-semibold text-ku-navy'
              )}
            >
              {notification.title}
            </h4>
          </div>
          <span className="shrink-0 text-xs text-gray-400">
            {timeAgo(notification.createdAt)}
          </span>
        </div>

        <p
          className={cn(
            'mt-1 text-sm leading-relaxed',
            notification.isRead ? 'text-gray-400' : 'text-gray-600'
          )}
        >
          {notification.message}
        </p>

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {!notification.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              disabled={isMarking}
              className="h-7 px-2 text-xs text-ku-blue hover:text-ku-royal"
            >
              {isMarking ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="mr-1 h-3 w-3" />
              )}
              Mark as read
            </Button>
          )}
          {notification.link && (
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
              <a href={notification.link}>View details</a>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const {
    data: notifications,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: res } = await api.get<ApiResponse<Notification[]>>(
        '/notifications'
      );
      return res.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.patch(`/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to mark as read';
      toast.error(message);
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to mark all as read';
      toast.error(message);
    },
  });

  // Filtered lists
  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;
  const announcementsCount = notifications?.filter((n) => n.type === 'ANNOUNCEMENT').length || 0;

  const filteredNotifications = (() => {
    if (!notifications) return [];
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.isRead);
      case 'announcements':
        return notifications.filter((n) => n.type === 'ANNOUNCEMENT');
      default:
        return notifications;
    }
  })();

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

  const hasNotifications = notifications && notifications.length > 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div
        variants={notificationVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ku-navy/10">
            <Bell className="h-5 w-5 text-ku-navy" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-ku-navy">Notifications</h1>
              {unreadCount > 0 && (
                <Badge className="bg-ku-blue text-white">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Stay updated with the latest information
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Mark All Read
          </Button>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div variants={notificationVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all" className="text-sm">
              <BellRing className="mr-2 h-4 w-4" />
              All
              {hasNotifications && (
                <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px] font-medium">
                  {notifications.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-sm">
              <Mail className="mr-2 h-4 w-4" />
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5 rounded-full bg-ku-blue/10 px-1.5 py-0.5 text-[10px] font-medium text-ku-blue">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-sm">
              <Megaphone className="mr-2 h-4 w-4" />
              Announcements
              {announcementsCount > 0 && (
                <span className="ml-1.5 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px] font-medium">
                  {announcementsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              {hasNotifications ? (
                <TabsContent value={activeTab} className="mt-0">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {filteredNotifications.length > 0 ? (
                      <ScrollArea className="h-[calc(100vh-320px)]">
                        <div className="space-y-3 pr-4">
                          <AnimatePresence mode="popLayout">
                            {filteredNotifications.map((notification) => (
                              <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
                                isMarking={markAsReadMutation.isPending}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </ScrollArea>
                    ) : (
                      <EmptyState />
                    )}
                  </motion.div>
                </TabsContent>
              ) : (
                <TabsContent value={activeTab} className="mt-0">
                  <EmptyState />
                </TabsContent>
              )}
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
