'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Key,
  Shield,
  Globe,
  Server,
  Link,
  Unlink,
  Eye,
  EyeOff,
  Copy,
  Check,
  Plus,
  Trash2,
  Clock,
  Wifi,
  WifiOff,
  Database,
  Lock,
  FileJson,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

interface SystemSettings {
  sso: {
    enabled: boolean;
    provider: string;
    clientId: string;
    issuerUrl: string;
    clientSecret: string;
    autoProvision: boolean;
  };
  apiKeys: ApiKey[];
  jwt: {
    secret: string;
    expiresIn: string;
    algorithm: string;
  };
  integration: {
    mode: 'mock' | 'iframe' | 'sdk' | 'api';
    baseUrl: string;
    apiVersion: string;
    webhookUrl: string;
    retryAttempts: number;
    timeout: number;
  };
  system: {
    appName: string;
    appVersion: string;
    environment: 'development' | 'staging' | 'production';
    maintenanceMode: boolean;
    debugMode: boolean;
    logLevel: string;
    defaultPageSize: number;
    sessionTimeout: number;
    rateLimiting: boolean;
    maxLoginAttempts: number;
  };
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  expiresAt: string | null;
  active: boolean;
}

// ── Validation Schema ──────────────────────────────────────────────────────

const ssoSchema = z.object({
  enabled: z.boolean(),
  provider: z.string().optional(),
  clientId: z.string().optional(),
  issuerUrl: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  clientSecret: z.string().optional(),
  autoProvision: z.boolean().optional(),
});

const integrationSchema = z.object({
  mode: z.enum(['mock', 'iframe', 'sdk', 'api']),
  baseUrl: z.string().optional(),
  apiVersion: z.string().optional(),
  webhookUrl: z.string().optional(),
  retryAttempts: z.coerce.number().min(0).max(10),
  timeout: z.coerce.number().min(1000).max(60000),
});

const systemSchema = z.object({
  appName: z.string().min(2),
  maintenanceMode: z.boolean(),
  debugMode: z.boolean(),
  logLevel: z.string(),
  defaultPageSize: z.coerce.number().min(5).max(100),
  sessionTimeout: z.coerce.number().min(5).max(1440),
  rateLimiting: z.boolean(),
  maxLoginAttempts: z.coerce.number().min(1).max(10),
});

const apiKeySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  expiresIn: z.string().optional(),
});

type SSOFormData = z.infer<typeof ssoSchema>;
type IntegrationFormData = z.infer<typeof integrationSchema>;
type SystemFormData = z.infer<typeof systemSchema>;
type ApiKeyFormData = z.infer<typeof apiKeySchema>;

// ── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ── SSO Configuration Section ─────────────────────────────────────────────

function SSOSection({
  settings,
  onSave,
  isSaving,
}: {
  settings: SystemSettings['sso'];
  onSave: (data: SSOFormData) => void;
  isSaving: boolean;
}) {
  const [showSecret, setShowSecret] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isDirty } } = useForm<SSOFormData>({
    defaultValues: {
      enabled: settings.enabled,
      provider: settings.provider || '',
      clientId: settings.clientId || '',
      issuerUrl: settings.issuerUrl || '',
      clientSecret: settings.clientSecret || '',
      autoProvision: settings.autoProvision || false,
    },
  });

  const ssoEnabled = watch('enabled');

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-white text-base">SSO Configuration</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={cn(
              ssoEnabled ? 'border-emerald-500/20 text-emerald-400' : 'border-slate-600 text-slate-500'
            )}
          >
            {ssoEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <CardDescription className="text-slate-500">
          Configure Single Sign-On integration for your university
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          {/* Enable Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('enabled')}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <span className="text-sm font-medium text-white">Enable SSO</span>
              <p className="text-xs text-slate-500">Allow users to sign in with SSO provider</p>
            </div>
          </label>

          <div className={cn('space-y-4', !ssoEnabled && 'opacity-40 pointer-events-none')}>
            <div className="grid grid-cols-2 gap-4">
              {/* Provider */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Provider</label>
                <select
                  {...register('provider')}
                  className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Provider</option>
                  <option value="AZURE_AD">Azure AD</option>
                  <option value="GOOGLE">Google Workspace</option>
                  <option value="OKTA">Okta</option>
                  <option value="CUSTOM">Custom OIDC</option>
                </select>
              </div>

              {/* Client ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Client ID</label>
                <Input
                  {...register('clientId')}
                  className="border-slate-700 bg-slate-800 text-white font-mono text-xs"
                  placeholder="sso-client-id"
                />
              </div>
            </div>

            {/* Issuer URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Issuer URL</label>
              <Input
                {...register('issuerUrl')}
                className="border-slate-700 bg-slate-800 text-white font-mono text-xs"
                placeholder="https://login.microsoftonline.com/..."
              />
              {errors.issuerUrl && <p className="text-xs text-red-400">{errors.issuerUrl.message}</p>}
            </div>

            {/* Client Secret */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Client Secret</label>
              <div className="relative">
                <Input
                  {...register('clientSecret')}
                  type={showSecret ? 'text' : 'password'}
                  className="border-slate-700 bg-slate-800 text-white font-mono text-xs pr-10"
                  placeholder="Enter client secret"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Auto Provision */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('autoProvision')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-medium text-white">Auto-Provision Users</span>
                <p className="text-xs text-slate-500">Automatically create accounts for new SSO users</p>
              </div>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save SSO Settings</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── API Keys Section ──────────────────────────────────────────────────────

function APIKeysSection({
  apiKeys,
  onCreate,
  onRevoke,
  isCreating,
}: {
  apiKeys: ApiKey[];
  onCreate: (data: ApiKeyFormData) => void;
  onRevoke: (id: string) => void;
  isCreating: boolean;
}) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [newApiKeyValue, setNewApiKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: { name: '', expiresIn: 'never' },
  });

  const handleCreateSubmit = (data: ApiKeyFormData) => {
    onCreate(data);
    setShowCreateDialog(false);
    reset();
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.slice(0, 4)}...${key.slice(-4)}`;
  };

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-white text-base">API Keys</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Key
          </Button>
        </div>
        <CardDescription className="text-slate-500">
          Manage API keys for external integrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {apiKeys.length > 0 ? (
          <div className="space-y-2">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3 transition-colors',
                  apiKey.active
                    ? 'border-slate-700 bg-slate-800/50'
                    : 'border-slate-800 bg-slate-900/50 opacity-60'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg',
                    apiKey.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  )}>
                    <Key className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{apiKey.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <code className="text-xs text-slate-500 font-mono">
                        {showNewKey === apiKey.id ? apiKey.key : maskKey(apiKey.key)}
                      </code>
                      {showNewKey === apiKey.id ? (
                        <button
                          onClick={() => handleCopyKey(apiKey.key)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowNewKey(apiKey.id)}
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600">
                      <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                      {apiKey.lastUsed && <span>| Last used {new Date(apiKey.lastUsed).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      apiKey.active ? 'border-emerald-500/20 text-emerald-400' : 'border-slate-700 text-slate-500'
                    )}
                  >
                    {apiKey.active ? 'Active' : 'Revoked'}
                  </Badge>
                  {apiKey.active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => onRevoke(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <Key className="h-10 w-10 text-slate-700 mb-2" />
            <p className="text-sm text-slate-500">No API keys configured</p>
            <p className="text-xs text-slate-600 mt-1">Create your first API key for external integrations</p>
          </div>
        )}
      </CardContent>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Key className="h-5 w-5 text-emerald-400" />
              Create API Key
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate a new API key for integrations
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreateSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Key Name *</label>
              <Input
                {...register('name')}
                className="border-slate-700 bg-slate-800 text-white"
                placeholder="e.g., Election Integration"
              />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Expiration</label>
              <select
                {...register('expiresIn')}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="never">Never expires</option>
                <option value="30d">30 days</option>
                <option value="60d">60 days</option>
                <option value="90d">90 days</option>
                <option value="180d">180 days</option>
                <option value="1y">1 year</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                {isCreating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : 'Create Key'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Integration Configuration Section ─────────────────────────────────────

function IntegrationSection({
  settings,
  onSave,
  isSaving,
}: {
  settings: SystemSettings['integration'];
  onSave: (data: IntegrationFormData) => void;
  isSaving: boolean;
}) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<IntegrationFormData>({
    defaultValues: {
      mode: settings.mode,
      baseUrl: settings.baseUrl || '',
      apiVersion: settings.apiVersion || '',
      webhookUrl: settings.webhookUrl || '',
      retryAttempts: settings.retryAttempts,
      timeout: settings.timeout,
    },
  });

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-white text-base">Integration Settings</CardTitle>
        </div>
        <CardDescription className="text-slate-500">
          Configure external integrations and API connectivity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          {/* Integration Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Integration Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {(['mock', 'iframe', 'sdk', 'api'] as const).map((mode) => (
                <label
                  key={mode}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-3 cursor-pointer transition-all text-center',
                    settings.mode === mode
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <input
                    type="radio"
                    {...register('mode')}
                    value={mode}
                    className="sr-only"
                  />
                  {mode === 'mock' ? <Database className="h-4 w-4 text-slate-400" /> :
                   mode === 'iframe' ? <Link className="h-4 w-4 text-blue-400" /> :
                   mode === 'sdk' ? <FileJson className="h-4 w-4 text-purple-400" /> :
                   <Server className="h-4 w-4 text-emerald-400" />}
                  <span className="text-xs capitalize text-slate-300">{mode}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Base URL</label>
            <Input
              {...register('baseUrl')}
              className="border-slate-700 bg-slate-800 text-white font-mono text-xs"
              placeholder="https://api.example.com/v1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* API Version */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">API Version</label>
              <Input
                {...register('apiVersion')}
                className="border-slate-700 bg-slate-800 text-white"
                placeholder="v1"
              />
            </div>

            {/* Webhook URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Webhook URL</label>
              <Input
                {...register('webhookUrl')}
                className="border-slate-700 bg-slate-800 text-white font-mono text-xs"
                placeholder="https://api.example.com/webhook"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Retry Attempts */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Retry Attempts</label>
              <Input
                {...register('retryAttempts')}
                type="number"
                min={0}
                max={10}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            {/* Timeout */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Timeout (ms)</label>
              <Input
                {...register('timeout')}
                type="number"
                min={1000}
                max={60000}
                step={1000}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSaving || !isDirty}
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
          >
            {isSaving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> Save Integration Settings</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── System Configuration Section ──────────────────────────────────────────

function SystemSection({
  settings,
  onSave,
  isSaving,
}: {
  settings: SystemSettings['system'];
  onSave: (data: SystemFormData) => void;
  isSaving: boolean;
}) {
  const { register, handleSubmit, watch, formState: { errors, isDirty } } = useForm<SystemFormData>({
    defaultValues: {
      appName: settings.appName,
      maintenanceMode: settings.maintenanceMode,
      debugMode: settings.debugMode,
      logLevel: settings.logLevel,
      defaultPageSize: settings.defaultPageSize,
      sessionTimeout: settings.sessionTimeout,
      rateLimiting: settings.rateLimiting,
      maxLoginAttempts: settings.maxLoginAttempts,
    },
  });

  const maintenanceMode = watch('maintenanceMode');
  const debugMode = watch('debugMode');

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-white text-base">System Configuration</CardTitle>
        </div>
        <CardDescription className="text-slate-500">
          Core system settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          {/* App Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Application Name</label>
            <Input
              {...register('appName')}
              className="border-slate-700 bg-slate-800 text-white"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-800 p-3 hover:bg-slate-800/50">
              <input
                type="checkbox"
                {...register('maintenanceMode')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-medium text-white">Maintenance Mode</span>
                <p className="text-xs text-slate-500">Block user access during maintenance</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-800 p-3 hover:bg-slate-800/50">
              <input
                type="checkbox"
                {...register('debugMode')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-medium text-white">Debug Mode</span>
                <p className="text-xs text-slate-500">Enable verbose error messages</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-slate-800 p-3 hover:bg-slate-800/50">
              <input
                type="checkbox"
                {...register('rateLimiting')}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="text-sm font-medium text-white">Rate Limiting</span>
                <p className="text-xs text-slate-500">Protect against brute force</p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Log Level */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Log Level</label>
              <select
                {...register('logLevel')}
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ERROR">Error</option>
                <option value="WARN">Warning</option>
                <option value="INFO">Info</option>
                <option value="DEBUG">Debug</option>
              </select>
            </div>

            {/* Default Page Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Default Page Size</label>
              <Input
                {...register('defaultPageSize')}
                type="number"
                min={5}
                max={100}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Session Timeout */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Session Timeout (minutes)
              </label>
              <Input
                {...register('sessionTimeout')}
                type="number"
                min={5}
                max={1440}
                className="border-slate-700 bg-slate-800 text-white"
              />
              {errors.sessionTimeout && (
                <p className="text-xs text-red-400">{errors.sessionTimeout.message}</p>
              )}
            </div>

            {/* Max Login Attempts */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Max Login Attempts</label>
              <Input
                {...register('maxLoginAttempts')}
                type="number"
                min={1}
                max={10}
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="submit"
              disabled={isSaving || !isDirty}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save System Settings</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── JWT Section ────────────────────────────────────────────────────────────

function JWTSecretSection({ jwt }: { jwt: SystemSettings['jwt'] }) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <Card className="border-slate-800 bg-slate-900">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-emerald-400" />
          <CardTitle className="text-white text-base">JWT Configuration</CardTitle>
        </div>
        <CardDescription className="text-slate-500">
          JWT token settings for authentication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* JWT Secret */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300">JWT Secret</label>
          <div className="relative">
            <Input
              value={showSecret ? jwt.secret : jwt.secret.slice(0, 8) + '••••••••••••••••'}
              readOnly
              className="border-slate-700 bg-slate-800 text-white font-mono text-xs pr-10"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-600">Keep this secret secure. Rotate regularly.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Expires In</label>
            <div className="flex h-10 items-center rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white">
              <Clock className="h-3.5 w-3.5 text-slate-500 mr-2" />
              {jwt.expiresIn}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Algorithm</label>
            <div className="flex h-10 items-center rounded-md border border-slate-700 bg-slate-800 px-3 text-sm text-white font-mono">
              {jwt.algorithm}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sso');

  // ── Data Fetching ──────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery<{ data: SystemSettings }>({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((res) => res.data),
  });

  const settings = data?.data;

  // ── Mutations ──────────────────────────────────────────────────────────
  const saveSSOMutation = useMutation({
    mutationFn: (formData: SSOFormData) => api.put('/admin/settings/sso', formData),
    onSuccess: () => {
      toast.success('SSO settings saved');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save SSO settings');
    },
  });

  const saveIntegrationMutation = useMutation({
    mutationFn: (formData: IntegrationFormData) => api.put('/admin/settings/integration', formData),
    onSuccess: () => {
      toast.success('Integration settings saved');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save integration settings');
    },
  });

  const saveSystemMutation = useMutation({
    mutationFn: (formData: SystemFormData) => api.put('/admin/settings/system', formData),
    onSuccess: () => {
      toast.success('System settings saved');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to save system settings');
    },
  });

  const createApiKeyMutation = useMutation({
    mutationFn: (formData: ApiKeyFormData) => api.post('/admin/settings/api-keys', formData),
    onSuccess: () => {
      toast.success('API key created');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create API key');
    },
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/settings/api-keys/${id}`),
    onSuccess: () => {
      toast.success('API key revoked');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to revoke API key');
    },
  });

  // ── Loading State ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-4 w-32 bg-slate-800" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 bg-slate-800 rounded-xl" />
          <Skeleton className="h-80 bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Error State ────────────────────────────────────────────────────────
  if (isError || !settings) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-red-500/10 p-4">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">Failed to load settings</h3>
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
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-slate-400 mt-1">
              System configuration and integrations management
            </p>
          </div>
          <Badge variant="outline" className="border-slate-700 text-slate-400">
            <Database className="h-3 w-3 mr-1" />
            Environment: {settings.system.environment}
          </Badge>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border border-slate-700 flex-wrap">
            <TabsTrigger value="sso" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Shield className="h-4 w-4 mr-2" />
              SSO
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="integration" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Globe className="h-4 w-4 mr-2" />
              Integration
            </TabsTrigger>
            <TabsTrigger value="jwt" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Lock className="h-4 w-4 mr-2" />
              JWT
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">
              <Server className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sso" className="mt-4">
            <SSOSection
              settings={settings.sso}
              onSave={(data) => saveSSOMutation.mutate(data)}
              isSaving={saveSSOMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="api-keys" className="mt-4">
            <APIKeysSection
              apiKeys={settings.apiKeys}
              onCreate={(data) => createApiKeyMutation.mutate(data)}
              onRevoke={(id) => revokeApiKeyMutation.mutate(id)}
              isCreating={createApiKeyMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="integration" className="mt-4">
            <IntegrationSection
              settings={settings.integration}
              onSave={(data) => saveIntegrationMutation.mutate(data)}
              isSaving={saveIntegrationMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="jwt" className="mt-4">
            <JWTSecretSection jwt={settings.jwt} />
          </TabsContent>

          <TabsContent value="system" className="mt-4">
            <SystemSection
              settings={settings.system}
              onSave={(data) => saveSystemMutation.mutate(data)}
              isSaving={saveSystemMutation.isPending}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
