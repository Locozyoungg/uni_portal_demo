'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Palette,
  Save,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Eye,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Image,
  Type,
  ChevronDown,
  Check,
  Undo2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────

interface BrandingConfig {
  universityName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  defaultTheme: 'light' | 'dark' | 'system';
  borderRadius: number;
  layout: string;
}

// ── Validation Schema ──────────────────────────────────────────────────────

const brandingSchema = z.object({
  universityName: z.string().min(2, 'University name is required'),
  logoUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  faviconUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color'),
  fontFamily: z.string().min(1, 'Font family is required'),
  defaultTheme: z.enum(['light', 'dark', 'system']),
  borderRadius: z.coerce.number().min(0).max(24),
  layout: z.string().optional(),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

// ── Color Presets ──────────────────────────────────────────────────────────

const colorPresets = [
  { name: 'Emerald', primary: '#059669', secondary: '#1e293b', accent: '#f59e0b' },
  { name: 'Navy', primary: '#1e3a5f', secondary: '#1e293b', accent: '#d4a843' },
  { name: 'Royal', primary: '#1d4ed8', secondary: '#1e293b', accent: '#f97316' },
  { name: 'Crimson', primary: '#dc2626', secondary: '#1e293b', accent: '#eab308' },
  { name: 'Teal', primary: '#0d9488', secondary: '#1e293b', accent: '#8b5cf6' },
  { name: 'Rose', primary: '#e11d48', secondary: '#1e293b', accent: '#6366f1' },
];

const fontOptions = [
  'Inter',
  'Poppins',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'Nunito',
];

// ── Layout Option ──────────────────────────────────────────────────────────

const layoutOptions = [
  { value: 'sidebar', label: 'Sidebar Navigation' },
  { value: 'topnav', label: 'Top Navigation' },
  { value: 'combined', label: 'Combined Layout' },
];

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminBrandingPage() {
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  // ── Data Fetching ──────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery<{ data: BrandingConfig }>({
    queryKey: ['admin-branding'],
    queryFn: () => api.get('/admin/branding').then((res) => res.data),
  });

  const branding = data?.data;

  // ── Form Setup ─────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: branding || {
      universityName: 'KU Demo University',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#059669',
      secondaryColor: '#1e293b',
      accentColor: '#f59e0b',
      fontFamily: 'Inter',
      defaultTheme: 'light',
      borderRadius: 8,
      layout: 'sidebar',
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (branding) {
      reset({
        universityName: branding.universityName,
        logoUrl: branding.logoUrl || '',
        faviconUrl: branding.faviconUrl || '',
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        fontFamily: branding.fontFamily,
        defaultTheme: branding.defaultTheme,
        borderRadius: branding.borderRadius,
        layout: branding.layout || 'sidebar',
      });
    }
  }, [branding, reset]);

  // Watch values for preview
  const watchedValues = watch();

  // ── Mutation ───────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (formData: BrandingFormData) => api.put('/admin/branding', formData),
    onSuccess: () => {
      toast.success('Branding configuration saved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-branding'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save branding');
    },
  });

  const handleFormSubmit = (formData: BrandingFormData) => {
    saveMutation.mutate(formData);
  };

  const handleReset = () => {
    if (branding) {
      reset(branding);
      toast.success('Reset to saved configuration');
    }
  };

  const handleColorPreset = (preset: typeof colorPresets[0]) => {
    setValue('primaryColor', preset.primary, { shouldDirty: true });
    setValue('secondaryColor', preset.secondary, { shouldDirty: true });
    setValue('accentColor', preset.accent, { shouldDirty: true });
  };

  // ── Loading State ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-32 bg-slate-800" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 bg-slate-800 rounded-xl" />
          <Skeleton className="h-96 bg-slate-800 rounded-xl" />
        </div>
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
        <h3 className="mt-4 text-lg font-semibold text-white">Failed to load branding config</h3>
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
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Portal Branding</h1>
          <p className="text-sm text-slate-400 mt-1">
            Customize the look and feel of your student portal
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit(handleFormSubmit)}
            disabled={saveMutation.isPending || !isDirty}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {saveMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Changes</>
            )}
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Form */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-6">
          {/* General */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-emerald-400" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* University Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">University Name</label>
                <Input
                  {...register('universityName')}
                  className="border-slate-700 bg-slate-800 text-white"
                />
                {errors.universityName && (
                  <p className="text-xs text-red-400">{errors.universityName.message}</p>
                )}
              </div>

              {/* Logo URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Logo URL</label>
                <div className="flex gap-2">
                  <Input
                    {...register('logoUrl')}
                    className="flex-1 border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                    placeholder="https://example.com/logo.png"
                  />
                  {watchedValues.logoUrl && (
                    <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-700 bg-slate-800 overflow-hidden shrink-0">
                      <img
                        src={watchedValues.logoUrl}
                        alt="Logo preview"
                        className="h-8 w-8 object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
                {errors.logoUrl && <p className="text-xs text-red-400">{errors.logoUrl.message}</p>}
              </div>

              {/* Font Family */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Font Family</label>
                <select
                  {...register('fontFamily')}
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {fontOptions.map((font) => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>

              {/* Layout */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Navigation Layout</label>
                <select
                  {...register('layout')}
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {layoutOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Theme Default */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Default Theme</label>
                <div className="flex gap-2">
                  {(['light', 'dark', 'system'] as const).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setValue('defaultTheme', theme, { shouldDirty: true })}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm border transition-all',
                        watchedValues.defaultTheme === theme
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      {theme === 'light' ? <Sun className="h-4 w-4" /> :
                       theme === 'dark' ? <Moon className="h-4 w-4" /> :
                       <Monitor className="h-4 w-4" />}
                      {theme.charAt(0).toUpperCase() + theme.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Border Radius: {watchedValues.borderRadius}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={2}
                  {...register('borderRadius', { valueAsNumber: true })}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>0px (Sharp)</span>
                  <span>24px (Rounded)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-emerald-400" />
                Color Scheme
              </CardTitle>
              <CardDescription className="text-slate-500">
                Choose a preset or customize individual colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Color Presets */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-2 block">Color Presets</label>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleColorPreset(preset)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-xs border transition-all',
                        watchedValues.primaryColor === preset.primary
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      )}
                    >
                      <div className="flex -space-x-1">
                        <div
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.secondary }}
                        />
                        <div
                          className="h-4 w-4 rounded-full border border-white/20"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-slate-300">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-3 gap-4">
                {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((field) => (
                  <div key={field} className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      {field === 'primaryColor' ? 'Primary' : field === 'secondaryColor' ? 'Secondary' : 'Accent'}
                    </label>
                    <div className="flex gap-2">
                      <div
                        className="h-10 w-10 shrink-0 rounded-md border border-slate-700 cursor-pointer"
                        style={{ backgroundColor: watchedValues[field] }}
                        onClick={() => setActiveColorPicker(activeColorPicker === field ? null : field)}
                      />
                      <Input
                        {...register(field)}
                        className="flex-1 border-slate-700 bg-slate-800 text-white font-mono text-xs uppercase"
                      />
                    </div>
                    {activeColorPicker === field && (
                      <input
                        type="color"
                        value={watchedValues[field]}
                        onChange={(e) => setValue(field, e.target.value, { shouldDirty: true })}
                        className="w-full h-8 rounded cursor-pointer"
                      />
                    )}
                    {errors[field] && (
                      <p className="text-xs text-red-400">{errors[field]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right: Preview */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="border-slate-800 bg-slate-900 sticky top-24">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  Preview
                </CardTitle>
                <div className="flex rounded-lg border border-slate-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPreviewMode('light')}
                    className={cn(
                      'p-1.5 transition-colors',
                      previewMode === 'light' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode('dark')}
                    className={cn(
                      'p-1.5 transition-colors',
                      previewMode === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    <Moon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Preview Card */}
              <div
                className={cn(
                  'rounded-xl overflow-hidden border transition-colors',
                  previewMode === 'dark'
                    ? 'bg-slate-950 border-slate-800 text-white'
                    : 'bg-white border-gray-200 text-gray-900'
                )}
                style={{ fontFamily: watchedValues.fontFamily }}
              >
                {/* Preview Header */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ backgroundColor: watchedValues.primaryColor }}
                >
                  {watchedValues.logoUrl ? (
                    <img src={watchedValues.logoUrl} alt="" className="h-8 w-8 rounded object-contain bg-white/20" />
                  ) : (
                    <div className="h-8 w-8 rounded flex items-center justify-center text-white font-bold text-sm bg-white/20">
                      KU
                    </div>
                  )}
                  <span className="text-sm font-semibold text-white">{watchedValues.universityName || 'University Name'}</span>
                  <Badge
                    className="ml-auto text-[10px]"
                    style={{
                      backgroundColor: watchedValues.accentColor,
                      color: '#fff',
                    }}
                  >
                    Student Portal
                  </Badge>
                </div>

                {/* Preview Body */}
                <div className="p-4 space-y-3">
                  {/* Sample Card */}
                  <div
                    className={cn(
                      'rounded-lg p-3 border',
                      previewMode === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
                    )}
                    style={{ borderRadius: watchedValues.borderRadius }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Dashboard Overview</span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: watchedValues.accentColor }}
                      >
                        NEW
                      </span>
                    </div>
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{ color: watchedValues.primaryColor }}
                    >
                      1,234
                    </div>
                    <p className="text-[10px] opacity-60">Total Students Enrolled</p>
                  </div>

                  {/* Sample Navigation Items */}
                  <div className="flex gap-2">
                    {['Dashboard', 'Courses', 'Profile'].map((item) => (
                      <div
                        key={item}
                        className={cn(
                          'text-[10px] px-2.5 py-1 rounded font-medium',
                          previewMode === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'
                        )}
                        style={{ borderRadius: watchedValues.borderRadius / 2 }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  {/* Sample Button */}
                  <div className="flex gap-2">
                    <button
                      className="text-xs px-3 py-1.5 rounded text-white font-medium"
                      style={{ backgroundColor: watchedValues.primaryColor, borderRadius: watchedValues.borderRadius }}
                    >
                      Primary Action
                    </button>
                    <button
                      className="text-xs px-3 py-1.5 rounded font-medium"
                      style={{
                        color: watchedValues.accentColor,
                        borderColor: watchedValues.accentColor,
                        borderWidth: 1,
                        borderRadius: watchedValues.borderRadius,
                      }}
                    >
                      Secondary
                    </button>
                  </div>

                  {/* Sample Status */}
                  <div className="flex gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: watchedValues.primaryColor }}
                    >
                      Active
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: watchedValues.accentColor }}
                    >
                      Pending
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: watchedValues.secondaryColor,
                        color: '#fff',
                      }}
                    >
                      Completed
                    </span>
                  </div>

                  {/* Sample Card Footer */}
                  <div
                    className={cn(
                      'rounded-lg p-3 border text-xs',
                      previewMode === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-gray-50 border-gray-200 text-gray-500'
                    )}
                    style={{ borderRadius: watchedValues.borderRadius, borderLeftColor: watchedValues.accentColor, borderLeftWidth: 3 }}
                  >
                    <span>
                      <strong className={previewMode === 'dark' ? 'text-white' : 'text-gray-800'}>Theme:</strong>{' '}
                      {previewMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Summary */}
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: watchedValues.primaryColor }} />
                  Primary
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: watchedValues.secondaryColor }} />
                  Secondary
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: watchedValues.accentColor }} />
                  Accent
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
