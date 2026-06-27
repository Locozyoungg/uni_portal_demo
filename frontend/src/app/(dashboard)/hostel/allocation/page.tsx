'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Home,
  Building2,
  DoorOpen,
  Bed,
  Users,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ClipboardCheck,
  Hash,
  Ruler,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────

interface HostelAllocation {
  id: string;
  hostel: {
    id: string;
    name: string;
    type: string;
    gender: string;
    location: string;
  };
  block: string;
  floor: number;
  roomNumber: string;
  bedNumber: string;
  roomType: string;
  capacity: number;
  occupants: number;
  status: 'ACTIVE' | 'PENDING' | 'TRANSFERRED' | 'VACATED';
  allocatedAt: string;
  expiryDate?: string;
  roommate?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  }>;
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ── Skeleton ───────────────────────────────────────────────────────────────

function AllocationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-36" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function AllocationError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <Home className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load allocation</h3>
      <p className="mt-1 text-sm text-gray-500">
        Something went wrong. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Not Allocated State ───────────────────────────────────────────────────

function NotAllocated() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-gray-50 p-4">
        <Home className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Not Allocated</h3>
      <p className="mt-1 text-sm text-gray-500">
        You have not been allocated a hostel room yet. Check back later or contact the accommodation office.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function HostelAllocationPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery<
    ApiResponse<HostelAllocation>
  >({
    queryKey: ['hostel-allocation'],
    queryFn: () => api.get('/hostel/allocation').then((r) => r.data),
  });

  const allocation = data?.data;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-36" />
        <AllocationSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <AllocationError onRetry={() => refetch()} />
      </div>
    );
  }

  // ── Not allocated ────────────────────────────────────────────────────────
  if (isError || !allocation) {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 p-6"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-ku-navy">Hostel Allocation</h1>
          <p className="text-sm text-gray-500">View your hostel accommodation details</p>
        </motion.div>
        <NotAllocated />
      </motion.div>
    );
  }

  const occupancyPercentage = allocation.capacity > 0
    ? Math.round((allocation.occupants / allocation.capacity) * 100)
    : 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ku-navy">Hostel Allocation</h1>
            <p className="text-sm text-gray-500">Your accommodation details</p>
          </div>
          <Badge
            className={cn(
              'text-xs px-3 py-1',
              allocation.status === 'ACTIVE'
                ? 'bg-green-50 text-green-700'
                : allocation.status === 'PENDING'
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-gray-50 text-gray-700'
            )}
          >
            {allocation.status === 'ACTIVE'
              ? 'Active'
              : allocation.status === 'PENDING'
                ? 'Pending'
                : allocation.status === 'TRANSFERRED'
                  ? 'Transferred'
                  : 'Vacated'}
          </Badge>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Allocation Card */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="overflow-hidden border-0">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-ku-navy to-ku-blue p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-white/10 p-3">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{allocation.hostel.name}</h2>
                  <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                    <MapPin className="h-3.5 w-3.5" />
                    {allocation.hostel.location}
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Room Details */}
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <DoorOpen className="mx-auto h-5 w-5 text-ku-blue" />
                  <p className="mt-2 text-xs text-gray-500">Room</p>
                  <p className="text-lg font-bold text-ku-navy">{allocation.roomNumber}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <Bed className="mx-auto h-5 w-5 text-ku-gold" />
                  <p className="mt-2 text-xs text-gray-500">Bed</p>
                  <p className="text-lg font-bold text-ku-navy">{allocation.bedNumber}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <Hash className="mx-auto h-5 w-5 text-purple-600" />
                  <p className="mt-2 text-xs text-gray-500">Block</p>
                  <p className="text-lg font-bold text-ku-navy">{allocation.block}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 text-center">
                  <Ruler className="mx-auto h-5 w-5 text-green-600" />
                  <p className="mt-2 text-xs text-gray-500">Floor</p>
                  <p className="text-lg font-bold text-ku-navy">{allocation.floor}</p>
                </div>
              </div>

              {/* Room Type + Capacity */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Room Type</p>
                      <p className="text-sm font-semibold text-ku-navy">
                        {allocation.roomType.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <Badge variant="secondary">{allocation.roomType}</Badge>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Occupancy</p>
                      <p className="text-sm font-semibold text-ku-navy">
                        {allocation.occupants} / {allocation.capacity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">{occupancyPercentage}%</span>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        occupancyPercentage >= 100
                          ? 'bg-red-500'
                          : occupancyPercentage >= 75
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                      )}
                      style={{ width: `${occupancyPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Allocation Date */}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Allocated: {formatDate(allocation.allocatedAt)}
                </div>
                {allocation.expiryDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Expires: {formatDate(allocation.expiryDate)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar: Roommates */}
        <motion.div variants={itemVariants}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-ku-navy">
                <Users className="h-4 w-4" />
                Roommates
              </CardTitle>
              <CardDescription>
                {allocation.roommate?.length || 0} of {allocation.capacity - 1} occupants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allocation.roommate && allocation.roommate.length > 0 ? (
                <div className="space-y-3">
                  {allocation.roommate.map((mate) => (
                    <div
                      key={mate.id}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ku-gold/10 text-sm font-bold text-ku-gold">
                        {mate.firstName[0]}{mate.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ku-navy">
                          {mate.firstName} {mate.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{mate.admissionNumber}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <Users className="h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No roommates assigned</p>
                  <p className="text-xs text-gray-400">
                    Room may be single-occupancy or not yet assigned
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
