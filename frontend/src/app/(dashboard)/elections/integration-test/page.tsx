'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Shield,
  Key,
  Activity,
  MessageSquare,
  Radio,
  Sliders,
  GitBranch,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  StopCircle,
  Clock,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Terminal,
  Code2,
  Lock,
  Unlock,
  Server,
  Globe,
  Smartphone,
  Cpu,
  Zap,
  ArrowRight,
  Check,
  X,
  Trash2,
  FileCode,
  HardDrive,
  Signal,
  Timer,
  ToggleLeft,
} from 'lucide-react';

import { api, type ApiResponse, getAuthToken } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useElectionStore } from '@/stores/election.store';
import { toast } from 'sonner';

// ───────────────────────────────── Types ─────────────────────────────────

type IntegrationMode = 'mock' | 'iframe' | 'sdk';

interface IntegrationLog {
  id: string;
  event: string;
  status: 'success' | 'error' | 'info';
  details?: string;
  createdAt: string;
}

interface PostMessageEvent {
  origin: string;
  data: unknown;
  timestamp: string;
}

interface ConnectivityResult {
  success: boolean;
  endpoint: string;
  latency: number;
  statusCode?: number;
  message?: string;
}

interface AuthFlowStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

// ──────────────────── Panel Components ────────────────────

function PanelHeader({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ku-navy/10 dark:bg-ku-navy/30">
          <Icon className="h-4.5 w-4.5 text-ku-navy" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function CodeBlock({
  content,
  label,
  variant = 'default',
}: {
  content: string;
  label?: string;
  variant?: 'default' | 'success' | 'error';
}) {
  return (
    <div className="rounded-lg overflow-hidden border border-border">
      {label && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              navigator.clipboard.writeText(content);
              toast.success('Copied to clipboard');
            }}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      )}
      <pre
        className={cn(
          'p-3 text-xs font-mono leading-relaxed overflow-x-auto max-h-48 overflow-y-auto',
          variant === 'success' && 'text-green-600 dark:text-green-400',
          variant === 'error' && 'text-red-600 dark:text-red-400',
          variant === 'default' && 'text-foreground'
        )}
        style={{ backgroundColor: '#0d1117' }}
      >
        <code>{content}</code>
      </pre>
    </div>
  );
}

function StatusDot({ status }: { status: 'success' | 'error' | 'info' | 'pending' }) {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    pending: 'bg-gray-400',
  };
  return (
    <span className={cn('inline-block h-2 w-2 rounded-full', colors[status])} />
  );
}

// ──────────────────── Panel 1: Integration Mode Switcher ────────────────────

function IntegrationModePanel() {
  const { integrationMode, setIntegrationMode, addLog } = useElectionStore();

  const modes: Array<{
    value: IntegrationMode;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
  }> = [
    {
      value: 'mock',
      label: 'Mock API',
      description: 'Simulated responses for development and testing without external dependencies.',
      icon: Cpu,
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    {
      value: 'iframe',
      label: 'Iframe Embed',
      description: 'Embed UniElection voting UI in an iframe with postMessage communication.',
      icon: Globe,
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      value: 'sdk',
      label: 'React SDK',
      description: 'Direct integration using the UniElection React SDK for seamless embedding.',
      icon: Code2,
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
  ];

  const handleModeChange = async (mode: IntegrationMode) => {
    setIntegrationMode(mode);
    addLog({
      id: Date.now().toString(),
      event: `Integration Mode: ${mode.toUpperCase()}`,
      status: 'info',
      details: `Switched to ${mode} integration mode`,
      createdAt: new Date().toISOString(),
    });

    try {
      await api.post('/integration/mock/toggle', { mode });
    } catch {
      // Toggle endpoint may not exist in production
    }

    toast.success(`Switched to ${mode.toUpperCase()} mode`);
  };

  const currentMode = modes.find((m) => m.value === integrationMode);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          icon={Radio}
          title="Integration Mode"
          description="Select the integration method for connecting to UniElection"
          action={
            <Badge variant="outline" className={cn('text-xs', currentMode?.color)}>
              <Zap className="mr-1 h-3 w-3" />
              {integrationMode.toUpperCase()}
            </Badge>
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = integrationMode === mode.value;
            return (
              <button
                key={mode.value}
                onClick={() => handleModeChange(mode.value)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 hover:shadow-md',
                  isActive
                    ? 'border-ku-gold bg-amber-50/50 dark:bg-amber-950/10 shadow-ku-gold/10'
                    : 'border-border bg-card hover:border-muted-foreground/30'
                )}
              >
                {isActive && (
                  <div className="absolute -top-2 -right-2">
                    <CheckCircle2 className="h-5 w-5 text-ku-gold" />
                  </div>
                )}
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', mode.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn('text-sm font-medium', isActive && 'text-ku-gold')}>
                  {mode.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {mode.description}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────── Panel 2: JWT Inspector ────────────────────

function JWTInspectorPanel() {
  const [tokenInput, setTokenInput] = useState('');
  const [decoded, setDecoded] = useState<{
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    signature: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = useCallback(async () => {
    setError(null);
    const token = tokenInput.trim() || getAuthToken();

    if (!token) {
      setError('No JWT token provided. Paste a token or log in first.');
      return;
    }

    try {
      const { jwtDecode } = await import('jwt-decode');
      const parts = token.split('.');
      if (parts.length !== 3) {
        setError('Invalid JWT format. Expected 3 parts separated by dots.');
        return;
      }

      const header = JSON.parse(atob(parts[0]));
      const payload = jwtDecode(token);
      const signature = parts[2];

      setDecoded({
        header: header as Record<string, unknown>,
        payload: payload as Record<string, unknown>,
        signature,
      });
      setTokenInput(token);
    } catch (e) {
      setError('Failed to decode token. Please ensure it is a valid JWT.');
    }
  }, [tokenInput]);

  const handleAutoFill = () => {
    const token = getAuthToken();
    if (token) {
      setTokenInput(token);
    } else {
      toast.error('No authentication token found in session.');
    }
  };

  const isExpired = decoded?.payload?.exp
    ? (decoded.payload.exp as number) * 1000 < Date.now()
    : null;

  const timeRemaining = decoded?.payload?.exp
    ? Math.max(0, Math.floor(((decoded.payload.exp as number) * 1000 - Date.now()) / 1000))
    : 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          icon={Shield}
          title="JWT Inspector"
          description="Decode and inspect JWT tokens for authentication debugging"
        />

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Paste JWT token here..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="pr-20 font-mono text-xs"
            />
            {tokenInput && (
              <button
                onClick={() => {
                  setTokenInput('');
                  setDecoded(null);
                  setError(null);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button size="sm" onClick={handleDecode}>
            <Code2 className="mr-1.5 h-4 w-4" />
            Decode
          </Button>
          <Button size="sm" variant="outline" onClick={handleAutoFill}>
            Auto-fill
          </Button>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-2.5 text-xs text-red-600 dark:text-red-400"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decoded token */}
        <AnimatePresence>
          {decoded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              {/* Expiry status */}
              <div className="flex items-center justify-between">
                {isExpired !== null && (
                  <div className="flex items-center gap-2">
                    {isExpired ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-xs font-medium text-red-500">Token Expired</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-xs font-medium text-green-500">
                          Valid ({Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s remaining)
                        </span>
                      </>
                    )}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(tokenInput || getAuthToken() || '');
                    toast.success('Token copied to clipboard');
                  }}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy Token
                </Button>
              </div>

              {/* Header */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Header</p>
                <CodeBlock
                  content={JSON.stringify(decoded.header, null, 2)}
                  label="JWT Header"
                />
              </div>

              {/* Payload */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Payload</p>
                <CodeBlock
                  content={JSON.stringify(decoded.payload, null, 2)}
                  label="JWT Payload"
                />
              </div>

              {/* Signature */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Signature</p>
                <CodeBlock
                  content={decoded.signature}
                  label="Signature (truncated)"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ──────────────────── Panel 3: Token Exchange ────────────────────

function TokenExchangePanel() {
  const {
    votingToken,
    setVotingToken,
    isExchanging,
    setIsExchanging,
    setExchangeError,
    exchangeError,
    addLog,
  } = useElectionStore();
  const [requestContent, setRequestContent] = useState<string | null>(null);
  const [responseContent, setResponseContent] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleExchange = async () => {
    setIsExchanging(true);
    setExchangeError(null);
    setRequestContent(null);
    setResponseContent(null);
    setLatency(null);
    setVerified(null);

    const reqData = {
      endpoint: 'POST /api/integration/auth/exchange',
      body: { token: getAuthToken()?.slice(0, 20) + '...' },
    };
    setRequestContent(JSON.stringify(reqData, null, 2));
    addLog({
      id: Date.now().toString(),
      event: 'Token Exchange Initiated',
      status: 'info',
      createdAt: new Date().toISOString(),
    });

    const start = Date.now();
    try {
      const { data: res } = await api.post<ApiResponse<{ votingToken: string }>>(
        '/api/integration/auth/exchange'
      );
      const end = Date.now();
      setLatency(end - start);

      setVotingToken(res.data.votingToken);
      setResponseContent(JSON.stringify(res.data, null, 2));
      addLog({
        id: (Date.now() + 1).toString(),
        event: 'Token Exchange Successful',
        status: 'success',
        details: `Latency: ${end - start}ms`,
        createdAt: new Date().toISOString(),
      });
      toast.success('JWT exchanged successfully');
    } catch (err: any) {
      const end = Date.now();
      setLatency(end - start);
      const errorMsg = err?.response?.data?.message || err?.message || 'Exchange failed';
      setExchangeError(errorMsg);
      setResponseContent(JSON.stringify({ error: errorMsg }, null, 2));
      addLog({
        id: (Date.now() + 1).toString(),
        event: 'Token Exchange Failed',
        status: 'error',
        details: errorMsg,
        createdAt: new Date().toISOString(),
      });
      toast.error(errorMsg);
    } finally {
      setIsExchanging(false);
    }
  };

  const handleVerify = async () => {
    if (!votingToken) {
      toast.error('No voting token to verify. Exchange a token first.');
      return;
    }

    setVerifying(true);
    setVerified(null);
    try {
      const { jwtDecode } = await import('jwt-decode');
      const payload = jwtDecode(votingToken) as { exp?: number };
      const valid = payload.exp ? payload.exp * 1000 > Date.now() : true;
      setVerified(valid);
      addLog({
        id: Date.now().toString(),
        event: 'Voting JWT Verified',
        status: valid ? 'success' : 'error',
        details: valid ? 'Token is valid' : 'Token has expired',
        createdAt: new Date().toISOString(),
      });
      toast.success(valid ? 'Voting token is valid' : 'Voting token has expired');
    } catch {
      setVerified(false);
      toast.error('Failed to verify voting token');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          icon={Key}
          title="Token Exchange"
          description="Exchange your portal JWT for a voting JWT via the UniElection auth service"
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={handleExchange}
            disabled={isExchanging}
            className="bg-ku-navy hover:bg-ku-navy/90 text-white"
          >
            {isExchanging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exchanging...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Exchange Portal JWT
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleVerify}
            disabled={!votingToken || verifying}
          >
            {verifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Shield className="mr-2 h-4 w-4" />
            )}
            Verify Voting JWT
          </Button>
        </div>

        {/* Latency measurement */}
        {latency !== null && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Latency: <strong className="text-foreground">{latency}ms</strong></span>
            {latency > 1000 && (
              <Badge variant="warning" className="text-[10px]">SLOW</Badge>
            )}
          </div>
        )}

        {/* Exchange error */}
        <AnimatePresence>
          {exchangeError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 p-2.5 text-xs text-red-600"
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {exchangeError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification result */}
        <AnimatePresence>
          {verified !== null && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 rounded-lg p-2.5 text-xs"
            >
              {verified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  <span className="text-green-600 dark:text-green-400">Voting JWT is valid and active</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="text-red-600 dark:text-red-400">Voting JWT verification failed or token expired</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Request / Response */}
        <div className="grid gap-3 sm:grid-cols-2">
          {requestContent && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Request</p>
              <CodeBlock content={requestContent} label="POST /api/integration/auth/exchange" />
            </div>
          )}
          {responseContent && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Response</p>
              <CodeBlock
                content={responseContent}
                label={exchangeError ? 'Error Response' : 'Success Response'}
                variant={exchangeError ? 'error' : 'success'}
              />
            </div>
          )}
        </div>

        {/* Current voting token */}
        {votingToken && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Voting JWT</p>
            <CodeBlock content={votingToken} label="Active Voting Token" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ──────────────────── Panel 4: Event Log ────────────────────

function EventLogPanel() {
  const { logs, clearLogs } = useElectionStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const statusStyles = {
    success: 'border-l-green-500 bg-green-50/50 dark:bg-green-950/10',
    error: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10',
    info: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10',
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          icon={Activity}
          title="Event Log"
          description="Real-time log of all integration events and API interactions"
          action={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {logs.length} events
              </Badge>
              {logs.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-red-500 hover:text-red-600"
                  onClick={clearLogs}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          }
        />

        <div
          className="rounded-lg border border-border overflow-y-auto"
          style={{ maxHeight: '320px' }}
        >
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-xs text-muted-foreground">No events yet</p>
              <p className="text-[10px] text-muted-foreground/70">
                Events will appear here as you interact with the integration features
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {[...logs].reverse().map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    'flex items-start gap-3 px-3 py-2.5 border-l-2 transition-colors',
                    statusStyles[log.status]
                  )}
                >
                  <StatusDot status={log.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{log.event}</span>
                      <span
                        className={cn(
                          'text-[10px] font-medium',
                          log.status === 'success' && 'text-green-600',
                          log.status === 'error' && 'text-red-600',
                          log.status === 'info' && 'text-blue-600'
                        )}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{log.details}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────── Panel 5: postMessage Monitor ────────────────────

function PostMessageMonitorPanel() {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<PostMessageEvent[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listenerRef = useRef<((event: MessageEvent) => void) | null>(null);
  const { addLog } = useElectionStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startListening = () => {
    if (listenerRef.current) return;
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        setMessages((prev) => [
          ...prev.slice(-99),
          {
            origin: event.origin,
            data,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev.slice(-99),
          {
            origin: event.origin,
            data: event.data,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    };
    window.addEventListener('message', handler);
    listenerRef.current = handler;
    setIsListening(true);
    addLog({
      id: Date.now().toString(),
      event: 'postMessage Monitor Started',
      status: 'info',
      createdAt: new Date().toISOString(),
    });
    toast.success('Listening for postMessage events');
  };

  const stopListening = () => {
    if (listenerRef.current) {
      window.removeEventListener('message', listenerRef.current);
      listenerRef.current = null;
    }
    setIsListening(false);
    addLog({
      id: Date.now().toString(),
      event: 'postMessage Monitor Stopped',
      status: 'info',
      createdAt: new Date().toISOString(),
    });
    toast.info('postMessage monitoring stopped');
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          icon={MessageSquare}
          title="postMessage Monitor"
          description="Monitor cross-origin communication events from iframe integrations"
          action={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {messages.length} messages
              </Badge>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={clearMessages}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          }
        />

        <div className="flex items-center gap-2">
          {isListening ? (
            <Button size="sm" variant="destructive" onClick={stopListening}>
              <StopCircle className="mr-1.5 h-4 w-4" />
              Stop Listening
            </Button>
          ) : (
            <Button size="sm" onClick={startListening}>
              <Play className="mr-1.5 h-4 w-4" />
              Start Listening
            </Button>
          )}
          <Badge
            variant={isListening ? 'success' : 'secondary'}
            className="text-[10px]"
          >
            {isListening ? (
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                Active
              </span>
            ) : (
              'Inactive'
            )}
          </Badge>
        </div>

        <div
          className="rounded-lg border border-border overflow-y-auto"
          style={{ maxHeight: '280px', backgroundColor: '#0d1117' }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-gray-600 mb-2" />
              <p className="text-xs text-gray-500">No postMessage events received</p>
              <p className="text-[10px] text-gray-600 mt-1">
                {isListening
                  ? 'Waiting for messages from iframe integrations...'
                  : 'Click "Start Listening" to begin monitoring'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {[...messages].reverse().map((msg, i) => (
                <div key={i} className="p-3 hover:bg-gray-900/50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-blue-400">
                      {msg.origin}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-green-400 whitespace-pre-wrap break-all leading-relaxed">
                    {JSON.stringify(msg.data, null, 2)}
                  </pre>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────── Panel 6: Connectivity Test ────────────────────

function ConnectivityTestPanel() {
  const { integrationMode, addLog } = useElectionStore();
  const [results, setResults] = useState<ConnectivityResult[]>([]);
  const [testing, setTesting] = useState(false);

  const endpoints = [
    { url: '/api/health', label: 'API Health Check', method: 'GET' },
    { url: '/api/integration/status', label: 'Integration Status', method: 'GET' },
    { url: '/api/elections', label: 'Elections API', method: 'GET' },
  ];

  const handleTest = async () => {
    setTesting(true);
    setResults([]);
    addLog({
      id: Date.now().toString(),
      event: 'Connectivity Test Started',
      status: 'info',
      details: `Testing ${endpoints.length} endpoints in ${integrationMode} mode`,
      createdAt: new Date().toISOString(),
    });

    const newResults: ConnectivityResult[] = [];
    for (const ep of endpoints) {
      const start = Date.now();
      try {
        const res = await api.get(ep.url, { timeout: 10000 });
        const latency = Date.now() - start;
        newResults.push({
          success: true,
          endpoint: ep.label,
          latency,
          statusCode: res.status,
          message: `${ep.method} ${ep.url}`,
        });
        addLog({
          id: (Date.now() + Math.random()).toString(),
          event: `${ep.label} - OK`,
          status: 'success',
          details: `${latency}ms`,
          createdAt: new Date().toISOString(),
        });
      } catch (err: any) {
        const latency = Date.now() - start;
        newResults.push({
          success: false,
          endpoint: ep.label,
          latency,
          statusCode: err?.response?.status,
          message: err?.message || 'Request failed',
        });
        addLog({
          id: (Date.now() + Math.random()).toString(),
          event: `${ep.label} - FAILED`,
          status: 'error',
          details: `${latency}ms - ${err?.message || 'Unknown error'}`,
          createdAt: new Date().toISOString(),
        });
      }
      setResults([...newResults]);
      // Small delay between tests
      await new Promise((r) => setTimeout(r, 300));
    }
    setTesting(false);
    const passed = newResults.filter((r) => r.success).length;
    toast.success(`Connectivity test complete: ${passed}/${endpoints.length} passed`);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          icon={Server}
          title="Connectivity Test"
          description="Test endpoint connectivity and response times for integration services"
        />

        <Button
          onClick={handleTest}
          disabled={testing}
          size="sm"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Signal className="mr-2 h-4 w-4" />
              Test UniElection Connectivity
            </>
          )}
        </Button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {results.map((result, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'flex items-center justify-between rounded-lg p-3 border-l-4',
                    result.success
                      ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/10'
                      : 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-xs font-medium">{result.endpoint}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {result.message}
                        {result.statusCode && ` - ${result.statusCode}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-mono',
                        result.latency > 1000
                          ? 'text-red-500'
                          : result.latency > 300
                            ? 'text-amber-500'
                            : 'text-green-500'
                      )}
                    >
                      {result.latency}ms
                    </span>
                    {result.success ? (
                      <StatusDot status="success" />
                    ) : (
                      <StatusDot status="error" />
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Summary */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">
                  {results.filter((r) => r.success).length}/{results.length} endpoints reachable
                </span>
                <Progress
                  value={(results.filter((r) => r.success).length / results.length) * 100}
                  className="w-24 h-1.5"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ──────────────────── Panel 7: Mock Response Configuration ────────────────────

function MockConfigPanel() {
  const { integrationMode, addLog } = useElectionStore();
  const [simulateErrors, setSimulateErrors] = useState(false);
  const [simulateLatency, setSimulateLatency] = useState(0);
  const [errorCode, setErrorCode] = useState('500');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    addLog({
      id: Date.now().toString(),
      event: 'Mock Config Updated',
      status: 'info',
      details: `Errors: ${simulateErrors}, Latency: ${simulateLatency}ms, ErrorCode: ${errorCode}`,
      createdAt: new Date().toISOString(),
    });

    try {
      await api.post('/integration/mock/config', {
        simulateErrors,
        simulateLatency,
        errorCode: simulateErrors ? parseInt(errorCode) : undefined,
      });
      toast.success('Mock configuration saved');
    } catch {
      toast.error('Failed to save mock configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const isMock = integrationMode === 'mock';

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          icon={Sliders}
          title="Mock Response Configuration"
          description="Configure mock API behavior for testing error handling and edge cases"
          action={
            !isMock && (
              <Badge variant="warning" className="text-[10px]">
                Switch to Mock mode
              </Badge>
            )
          }
        />

        {/* Disabled overlay */}
        {!isMock && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
            <p className="text-xs text-muted-foreground">Switch to Mock mode to configure</p>
          </div>
        )}

        <div className={cn('relative', !isMock && 'pointer-events-none')}>
          <div className="space-y-4">
            {/* Simulate errors toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Simulate Errors</label>
                <p className="text-xs text-muted-foreground">Randomly fail API requests to test error handling</p>
              </div>
              <button
                onClick={() => setSimulateErrors(!simulateErrors)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  simulateErrors ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                    simulateErrors && 'translate-x-5'
                  )}
                />
              </button>
            </div>

            {/* Simulate latency slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Simulate Latency</label>
                <span className="text-xs font-mono text-muted-foreground">{simulateLatency}ms</span>
              </div>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={simulateLatency}
                onChange={(e) => setSimulateLatency(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-ku-navy"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0ms</span>
                <span>2500ms</span>
                <span>5000ms</span>
              </div>
            </div>

            {/* Error code selector */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Error Code</label>
              <Select value={errorCode} onValueChange={setErrorCode} disabled={!simulateErrors}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select error code" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">400 Bad Request</SelectItem>
                  <SelectItem value="401">401 Unauthorized</SelectItem>
                  <SelectItem value="403">403 Forbidden</SelectItem>
                  <SelectItem value="404">404 Not Found</SelectItem>
                  <SelectItem value="429">429 Rate Limited</SelectItem>
                  <SelectItem value="500">500 Internal Server Error</SelectItem>
                  <SelectItem value="502">502 Bad Gateway</SelectItem>
                  <SelectItem value="503">503 Service Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={isSaving || !isMock}
              size="sm"
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Apply Configuration
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────── Panel 8: Auth Flow Diagram ────────────────────

function AuthFlowDiagramPanel() {
  const { votingToken, logs } = useElectionStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps: AuthFlowStep[] = [
    {
      id: 'login',
      label: 'Portal Login',
      description: 'Authenticate via KU Student Portal',
      icon: Lock,
      status: logs.some((l) => l.event === 'Token Exchange Initiated') ? 'completed' : 'pending',
    },
    {
      id: 'exchange',
      label: 'JWT Exchange',
      description: 'POST /api/integration/auth/exchange',
      icon: RefreshCw,
      status: votingToken
        ? 'completed'
        : logs.some((l) => l.event === 'Token Exchange Initiated')
          ? logs.some((l) => l.event === 'Token Exchange Successful')
            ? 'completed'
            : logs.some((l) => l.event === 'Token Exchange Failed')
              ? 'error'
              : 'in_progress'
          : 'pending',
    },
    {
      id: 'integration',
      label: 'Voting JWT',
      description: 'Token delivered to iframe/SDK/mock',
      icon: Key,
      status: votingToken ? 'completed' : 'pending',
    },
    {
      id: 'vote',
      label: 'Cast Vote',
      description: 'Vote submitted + transaction hash',
      icon: CheckCircle2,
      status: logs.some((l) => l.event === 'Vote Cast' && l.status === 'success')
        ? 'completed'
        : logs.some((l) => l.event === 'Vote Failed')
          ? 'error'
          : 'pending',
    },
  ];

  const completedSteps = steps.filter((s) => s.status === 'completed').length;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <PanelHeader
          icon={GitBranch}
          title="Authentication Flow"
          description="Visual representation of the authentication flow through the integration pipeline"
          action={
            <Badge variant="outline" className="text-xs">
              {completedSteps}/{steps.length} steps
            </Badge>
          }
        />

        <Progress value={(completedSteps / steps.length) * 100} className="h-1.5" />

        <div className="space-y-0">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300',
                      step.status === 'completed' &&
                        'border-green-500 bg-green-50 dark:bg-green-950/20',
                      step.status === 'in_progress' &&
                        'border-ku-gold bg-amber-50 dark:bg-amber-950/20',
                      step.status === 'error' && 'border-red-500 bg-red-50 dark:bg-red-950/20',
                      step.status === 'pending' &&
                        'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900'
                    )}
                  >
                    {step.status === 'completed' ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : step.status === 'error' ? (
                      <X className="h-4 w-4 text-red-500" />
                    ) : (
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          step.status === 'in_progress'
                            ? 'text-ku-gold'
                            : 'text-muted-foreground'
                        )}
                      />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        'w-0.5 h-8',
                        step.status === 'completed'
                          ? 'bg-green-300 dark:bg-green-700'
                          : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    />
                  )}
                </div>

                {/* Content */}
                <div className={cn('flex-1 pb-6', isLast && 'pb-0')}>
                  <div
                    className={cn(
                      'flex items-center gap-2 mb-0.5',
                      step.status === 'completed' && 'text-green-600 dark:text-green-400',
                      step.status === 'in_progress' && 'text-ku-gold',
                      step.status === 'error' && 'text-red-500'
                    )}
                  >
                    <span className="text-sm font-medium">{step.label}</span>
                    {step.status === 'completed' && (
                      <Badge variant="success" className="text-[10px] py-0">Done</Badge>
                    )}
                    {step.status === 'in_progress' && (
                      <Badge variant="warning" className="text-[10px] py-0">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        In Progress
                      </Badge>
                    )}
                    {step.status === 'error' && (
                      <Badge variant="destructive" className="text-[10px] py-0">Failed</Badge>
                    )}
                    {step.status === 'pending' && (
                      <Badge variant="secondary" className="text-[10px] py-0">Pending</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{step.description}</p>

                  {/* Specific details for each step */}
                  {step.id === 'exchange' && votingToken && (
                    <p className="text-[10px] text-green-600 mt-1 font-mono">
                      Token received
                    </p>
                  )}
                  {step.id === 'vote' &&
                    !logs.some((l) => l.event === 'Vote Cast' && l.status === 'success') && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Vote in the election detail page to complete the flow
                      </p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────── Integration Status Bar ────────────────────

function IntegrationStatusBar() {
  const { integrationMode, votingToken } = useElectionStore();
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    const check = async () => {
      try {
        await api.get('/api/health', { timeout: 5000 });
        setApiStatus('connected');
      } catch {
        setApiStatus('disconnected');
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 px-1 text-xs">
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            apiStatus === 'connected' && 'bg-green-500',
            apiStatus === 'disconnected' && 'bg-red-500',
            apiStatus === 'checking' && 'bg-yellow-500 animate-pulse'
          )}
        />
        <span className="text-muted-foreground">
          API: {apiStatus === 'connected' ? 'Connected' : apiStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] py-0 h-5">
          Mode: {integrationMode.toUpperCase()}
        </Badge>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            votingToken ? 'bg-green-500' : 'bg-gray-400'
          )}
        />
        <span className="text-muted-foreground">
          Voting JWT: {votingToken ? 'Present' : 'None'}
        </span>
      </div>
    </div>
  );
}

// ──────────────────── Main Integration Test Page ────────────────────

export default function IntegrationTestPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-ku-navy to-ku-blue shadow-md">
            <Wrench className="h-5 w-5 text-ku-gold" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">Integration Testing</h1>
            <p className="text-sm text-muted-foreground">
              Developer dashboard for testing and debugging UniElection integration
            </p>
          </div>
          <div className="hidden md:block">
            <IntegrationStatusBar />
          </div>
        </div>

        {/* Mobile status bar */}
        <div className="md:hidden mt-3">
          <IntegrationStatusBar />
        </div>
      </motion.div>

      {/* Panels Grid */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {/* Panel 1 - Integration Mode (spans 2 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2"
        >
          <IntegrationModePanel />
        </motion.div>

        {/* Panel 4 - Event Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <EventLogPanel />
        </motion.div>

        {/* Panel 2 - JWT Inspector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <JWTInspectorPanel />
        </motion.div>

        {/* Panel 8 - Auth Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <AuthFlowDiagramPanel />
        </motion.div>

        {/* Panel 3 - Token Exchange */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2"
        >
          <TokenExchangePanel />
        </motion.div>

        {/* Panel 6 - Connectivity Test */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ConnectivityTestPanel />
        </motion.div>

        {/* Panel 5 - postMessage Monitor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-2"
        >
          <PostMessageMonitorPanel />
        </motion.div>

        {/* Panel 7 - Mock Config */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <MockConfigPanel />
        </motion.div>
      </div>
    </div>
  );
}
