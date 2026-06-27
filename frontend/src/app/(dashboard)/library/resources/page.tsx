'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ExternalLink,
  Globe,
  BookMarked,
  Video,
  FileText,
  Headphones,
  Monitor,
  Lock,
  Unlock,
  Search,
  Filter,
  Library,
} from 'lucide-react';
import Link from 'next/link';
import { api, type ApiResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────

interface DigitalResource {
  id: string;
  title: string;
  description: string;
  category: 'E_BOOK' | 'JOURNAL' | 'DATABASE' | 'VIDEO' | 'AUDIO' | 'THESIS' | 'PAST_PAPER';
  accessLevel: 'OPEN' | 'RESTRICTED' | 'INSTITUTION';
  url?: string;
  publisher?: string;
  author?: string;
  year?: number;
  tags: string[];
  thumbnailUrl?: string;
}

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

// ── Category Config ────────────────────────────────────────────────────────

const categoryConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  E_BOOK: { icon: BookOpen, label: 'E-Book', color: 'bg-blue-50 text-blue-600' },
  JOURNAL: { icon: FileText, label: 'Journal', color: 'bg-purple-50 text-purple-600' },
  DATABASE: { icon: Monitor, label: 'Database', color: 'bg-green-50 text-green-600' },
  VIDEO: { icon: Video, label: 'Video', color: 'bg-red-50 text-red-600' },
  AUDIO: { icon: Headphones, label: 'Audio', color: 'bg-orange-50 text-orange-600' },
  THESIS: { icon: BookMarked, label: 'Thesis', color: 'bg-teal-50 text-teal-600' },
  PAST_PAPER: { icon: FileText, label: 'Past Paper', color: 'bg-pink-50 text-pink-600' },
};

const accessConfig: Record<string, { icon: React.ElementType; label: string; className: string }> = {
  OPEN: { icon: Unlock, label: 'Open Access', className: 'bg-green-50 text-green-600' },
  RESTRICTED: { icon: Lock, label: 'Restricted', className: 'bg-red-50 text-red-600' },
  INSTITUTION: { icon: Library, label: 'Institution Only', className: 'bg-yellow-50 text-yellow-600' },
};

const categories = [
  { value: 'all', label: 'All' },
  { value: 'E_BOOK', label: 'E-Books' },
  { value: 'JOURNAL', label: 'Journals' },
  { value: 'DATABASE', label: 'Databases' },
  { value: 'VIDEO', label: 'Videos' },
  { value: 'AUDIO', label: 'Audio' },
  { value: 'THESIS', label: 'Theses' },
  { value: 'PAST_PAPER', label: 'Past Papers' },
];

// ── Skeleton ───────────────────────────────────────────────────────────────

function ResourcesSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ── Error State ────────────────────────────────────────────────────────────

function ResourcesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-red-50 p-4">
        <Library className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Failed to load digital resources</h3>
      <p className="mt-1 text-sm text-gray-500">
        Something went wrong. Please try again.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Retry
      </Button>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────

function ResourcesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-full bg-gray-50 p-4">
        <BookOpen className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">No resources found</h3>
      <p className="mt-1 text-sm text-gray-500">
        No digital resources match your current filters.
      </p>
    </div>
  );
}

// ── Resource Card ──────────────────────────────────────────────────────────

function ResourceCard({ resource, index }: { resource: DigitalResource; index: number }) {
  const cat = categoryConfig[resource.category] || categoryConfig.E_BOOK;
  const CatIcon = cat.icon;
  const access = accessConfig[resource.accessLevel] || accessConfig.RESTRICTED;
  const AccessIcon = access.icon;

  return (
    <motion.div variants={cardVariants}>
      <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-5">
          {/* Category + Access Level */}
          <div className="flex items-start justify-between">
            <div className={cn('rounded-lg p-2.5', cat.color)}>
              <CatIcon className="h-5 w-5" />
            </div>
            <Badge variant="secondary" className={cn('text-xs', access.className)}>
              <AccessIcon className="mr-1 h-3 w-3" />
              {access.label}
            </Badge>
          </div>

          {/* Title + Description */}
          <h3 className="mt-3 font-semibold text-ku-navy line-clamp-1">{resource.title}</h3>
          {resource.description && (
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{resource.description}</p>
          )}

          {/* Meta */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-400">
            <Badge variant="secondary" className={cn('text-xs font-normal', cat.color)}>
              {cat.label}
            </Badge>

            {resource.author && (
              <span className="line-clamp-1">{resource.author}</span>
            )}

            {resource.year && (
              <span>{resource.year}</span>
            )}

            {resource.publisher && (
              <span className="line-clamp-1">{resource.publisher}</span>
            )}
          </div>

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {resource.tags.length > 3 && (
                <span className="text-[10px] text-gray-400">+{resource.tags.length - 3}</span>
              )}
            </div>
          )}

          {/* Action */}
          <div className="mt-4">
            {resource.url ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Access Resource
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Contact Library
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DigitalResourcesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const { data, isLoading, isError, refetch } = useQuery<ApiResponse<DigitalResource[]>>({
    queryKey: ['digital-resources'],
    queryFn: () => api.get('/library/resources').then((r) => r.data),
  });

  const resources = data?.data || [];

  // Filter resources
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      !searchQuery ||
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Count per category
  const categoryCounts = resources.reduce<Record<string, number>>((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {});

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <ResourcesSkeleton />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="p-6">
        <ResourcesError onRetry={() => refetch()} />
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
      {/* Header */}
      <motion.div variants={cardVariants}>
        <h1 className="text-2xl font-bold text-ku-navy">Digital Resources</h1>
        <p className="text-sm text-gray-500">
          Access e-books, journals, databases, and more
        </p>
      </motion.div>

      {/* Search */}
      <motion.div variants={cardVariants}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by title, author, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </motion.div>

      {/* Category Tabs */}
      <motion.div variants={cardVariants}>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="all">
                All ({resources.length})
              </TabsTrigger>
              {categories.filter((c) => c.value !== 'all').map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label} ({categoryCounts[cat.value] || 0})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeCategory} className="mt-6">
            {filteredResources.length === 0 ? (
              <ResourcesEmpty />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map((resource, i) => (
                  <ResourceCard key={resource.id} resource={resource} index={i} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
